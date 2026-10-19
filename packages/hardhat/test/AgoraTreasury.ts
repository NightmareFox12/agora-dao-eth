import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AgoraDao, AgoraDaoFactory, AgoraTreasury, AgoraVotes } from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const PROPOSAL_MANAGER_ROLE = ethers.id("PROPOSAL_MANAGER_ROLE");

const Status = { Active: 0, Approved: 1, Rejected: 2, QuorumNotReached: 3, Executed: 4 } as const;
const Choice = { Against: 0, For: 1, Abstain: 2 } as const;
const ActionKind = { None: 0, PayETH: 1 } as const;

const DAY = 24 * 60 * 60;
const ONE_ETH = ethers.parseEther("1");

describe("AgoraTreasury", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let treasury: AgoraTreasury;
  let votes: AgoraVotes;

  let admin: HardhatEthersSigner; // creator of the DAO
  let proposalManager: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let carol: HardhatEthersSigner;
  let dave: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  beforeEach(async () => {
    [, admin, proposalManager, alice, bob, carol, dave, recipient, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    treasury = (await ethers.getContractAt("AgoraTreasury", await dao.treasury())) as AgoraTreasury;
    votes = (await ethers.getContractAt("AgoraVotes", await dao.votes())) as AgoraVotes;

    await dao.connect(admin).registerRole(PROPOSAL_MANAGER_ROLE, proposalManager.address);
    for (const member of [alice, bob, carol, dave]) await dao.connect(member).joinDao();
  });

  describe("setup", function () {
    it("is created together with the DAO and knows it", async function () {
      expect(await dao.treasury()).to.not.equal(ethers.ZeroAddress);
      expect(await treasury.dao()).to.equal(await dao.getAddress());
      expect(await treasury.votes()).to.equal(await dao.votes());
    });

    it("gives every DAO its own treasury", async function () {
      await factory.connect(admin).createDao("Solar Club", "Another DAO", [1], "");
      const [, second] = await factory.getAllDaos();
      const secondDao = await ethers.getContractAt("AgoraDao", second.daoAddress);

      expect(await secondDao.treasury()).to.not.equal(await dao.treasury());
    });

    it("cannot be initialized twice", async function () {
      await expect(treasury.initialize(outsider.address, outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraTreasury")).deploy();

      await expect(implementation.initialize(outsider.address, outsider.address)).to.be.revertedWith(
        "Already initialized",
      );
    });

    it("starts empty", async function () {
      expect(await treasury.balance()).to.equal(0n);
      expect(await treasury.totalDeposited()).to.equal(0n);
      expect(await treasury.totalPaid()).to.equal(0n);
    });
  });

  describe("receiving money", function () {
    it("accepts donations from anyone and keeps running totals", async function () {
      await expect(outsider.sendTransaction({ to: await treasury.getAddress(), value: ONE_ETH }))
        .to.emit(treasury, "Deposited")
        .withArgs(outsider.address, ONE_ETH);

      expect(await treasury.balance()).to.equal(ONE_ETH);
      expect(await treasury.totalDeposited()).to.equal(ONE_ETH);

      await alice.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("0.5") });

      expect(await treasury.balance()).to.equal(ethers.parseEther("1.5"));
      expect(await treasury.totalDeposited()).to.equal(ethers.parseEther("1.5"));
    });

    it("rejects transfers of zero", async function () {
      await expect(outsider.sendTransaction({ to: await treasury.getAddress(), value: 0 })).to.be.revertedWith(
        "No ETH sent",
      );
    });
  });

  describe("spending money", function () {
    beforeEach(async () => {
      // put 5 ETH in the treasury so there is something to spend
      await outsider.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("5") });
    });

    it("refuses direct calls to pay(), even from the admin", async function () {
      for (const signer of [admin, outsider, alice, proposalManager]) {
        await expect(treasury.connect(signer).pay(recipient.address, ONE_ETH, 0)).to.be.revertedWith(
          "Only the votes module can spend",
        );
      }
    });

    it("sends ETH when an approved payout proposal is executed", async function () {
      await votes
        .connect(proposalManager)
        .createPayoutProposal("Pay for the venue", "Rent for the November meetup", 3, recipient.address, ONE_ETH);

      for (const voter of [alice, bob, carol]) await votes.connect(voter).castVote(0, Choice.For);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);
      expect((await votes.getProposal(0)).status).to.equal(Status.Approved);

      const tx = votes.connect(outsider).execute(0);

      await expect(tx).to.changeEtherBalances([recipient, await treasury.getAddress()], [ONE_ETH, -ONE_ETH]);
      await expect(tx).to.emit(treasury, "Paid").withArgs(recipient.address, ONE_ETH, 0);
      expect((await votes.getProposal(0)).status).to.equal(Status.Executed);
      expect(await treasury.totalPaid()).to.equal(ONE_ETH);
    });

    it("refuses to execute a proposal that was not approved", async function () {
      await votes.connect(proposalManager).createPayoutProposal("Pay", "nope", 3, recipient.address, ONE_ETH);
      await votes.connect(alice).castVote(0, Choice.Against);
      await votes.connect(bob).castVote(0, Choice.Against);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);

      await expect(votes.execute(0)).to.be.revertedWith("The proposal is not approved");
    });

    it("refuses to execute an approved text proposal (no action)", async function () {
      await votes.connect(proposalManager).createProposal("Should we do X?", "Just a text decision", 3);
      await votes.connect(alice).castVote(0, Choice.For);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);

      await expect(votes.execute(0)).to.be.revertedWith("The proposal has no action");
    });

    it("refuses a double execution", async function () {
      await votes.connect(proposalManager).createPayoutProposal("Pay", "yes", 3, recipient.address, ONE_ETH);
      await votes.connect(alice).castVote(0, Choice.For);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);
      await votes.execute(0);

      await expect(votes.execute(0)).to.be.revertedWith("The proposal is not approved");
    });

    it("refuses to pay more than the treasury holds", async function () {
      await votes
        .connect(proposalManager)
        .createPayoutProposal("Too much", "x", 3, recipient.address, ethers.parseEther("100"));
      await votes.connect(alice).castVote(0, Choice.For);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);

      await expect(votes.execute(0)).to.be.revertedWith("Not enough funds in the treasury");
      // the status does change to Executed because that happens before the external call: the whole tx reverts, so
      // the state is rolled back
      expect((await votes.getProposal(0)).status).to.equal(Status.Approved);
    });

    it("validates the payout at creation time", async function () {
      await expect(
        votes.connect(proposalManager).createPayoutProposal("x", "x", 3, ethers.ZeroAddress, ONE_ETH),
      ).to.be.revertedWith("Invalid recipient");
      await expect(
        votes.connect(proposalManager).createPayoutProposal("x", "x", 3, recipient.address, 0),
      ).to.be.revertedWith("The amount must be greater than zero");
    });

    it("executes several payouts in order", async function () {
      await votes.connect(proposalManager).createPayoutProposal("Pay 1", "x", 3, recipient.address, ONE_ETH);
      await votes
        .connect(proposalManager)
        .createPayoutProposal("Pay 2", "x", 3, recipient.address, ethers.parseEther("2"));
      await votes.connect(alice).castVote(0, Choice.For);
      await votes.connect(alice).castVote(1, Choice.For);
      await time.increase(3 * DAY + 1);
      await votes.finalize(0);
      await votes.finalize(1);

      await votes.execute(0);
      await votes.execute(1);
      expect(await treasury.balance()).to.equal(ethers.parseEther("2"));
      expect(await treasury.totalPaid()).to.equal(ethers.parseEther("3"));
    });

    it("records the action and the recipient on the proposal", async function () {
      await votes.connect(proposalManager).createPayoutProposal("Pay", "x", 3, recipient.address, ONE_ETH);

      const proposal = await votes.getProposal(0);
      expect(proposal.action.kind).to.equal(ActionKind.PayETH);
      expect(proposal.action.target).to.equal(recipient.address);
      expect(proposal.action.value).to.equal(ONE_ETH);
    });

    it("a text proposal records no action", async function () {
      await votes.connect(proposalManager).createProposal("Text", "just a decision", 3);

      const proposal = await votes.getProposal(0);
      expect(proposal.action.kind).to.equal(ActionKind.None);
      expect(proposal.action.target).to.equal(ethers.ZeroAddress);
      expect(proposal.action.value).to.equal(0n);
    });
  });
});
