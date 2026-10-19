import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AgoraDao, AgoraDaoFactory, AgoraVotes } from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const AUDITOR_ROLE = ethers.id("AUDITOR_ROLE");
const PROPOSAL_MANAGER_ROLE = ethers.id("PROPOSAL_MANAGER_ROLE");
const TASK_MANAGER_ROLE = ethers.id("TASK_MANAGER_ROLE");

const Status = { Active: 0, Approved: 1, Rejected: 2, QuorumNotReached: 3 } as const;
const Choice = { Against: 0, For: 1, Abstain: 2 } as const;

const DAY = 24 * 60 * 60;
const TITLE = "¿Hacemos un meetup en noviembre?";
const DESCRIPTION = "Propongo organizar un meetup presencial en noviembre para presentar la DAO.";

describe("AgoraVotes", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let votes: AgoraVotes;

  let admin: HardhatEthersSigner; // creator of the DAO
  let proposalManager: HardhatEthersSigner;
  let auditor: HardhatEthersSigner;
  let alice: HardhatEthersSigner; // member
  let bob: HardhatEthersSigner; // member
  let carol: HardhatEthersSigner; // member
  let dave: HardhatEthersSigner; // member
  let outsider: HardhatEthersSigner; // not in the DAO

  const createProposal = (signer = proposalManager, days = 7) =>
    votes.connect(signer).createProposal(TITLE, DESCRIPTION, days);

  // creates proposal 0 with 5 members in the DAO (admin + 4 members): quorum is 1 vote (20%)
  const activeProposal = async () => {
    await createProposal();
  };

  beforeEach(async () => {
    [, admin, proposalManager, auditor, alice, bob, carol, dave, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    votes = (await ethers.getContractAt("AgoraVotes", await dao.votes())) as AgoraVotes;

    await dao.connect(admin).registerRole(AUDITOR_ROLE, auditor.address);
    await dao.connect(admin).registerRole(PROPOSAL_MANAGER_ROLE, proposalManager.address);
    for (const member of [alice, bob, carol, dave]) await dao.connect(member).joinDao();
  });

  describe("setup", function () {
    it("is created together with the DAO and knows it", async function () {
      expect(await dao.votes()).to.not.equal(ethers.ZeroAddress);
      expect(await votes.dao()).to.equal(await dao.getAddress());
    });

    it("gives every DAO its own module", async function () {
      await factory.connect(admin).createDao("Solar Club", "Another DAO", [1], "");
      const [, second] = await factory.getAllDaos();
      const secondDao = await ethers.getContractAt("AgoraDao", second.daoAddress);

      expect(await secondDao.votes()).to.not.equal(await dao.votes());
    });

    it("cannot be initialized twice", async function () {
      await expect(votes.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraVotes")).deploy();

      await expect(implementation.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("keeps the limits the frontend form expects", async function () {
      expect(await votes.MAX_TITLE_LENGTH()).to.equal(100n);
      expect(await votes.MAX_DESCRIPTION_LENGTH()).to.equal(2000n);
      expect(await votes.MIN_VOTING_DAYS()).to.equal(3n);
      expect(await votes.MAX_VOTING_DAYS()).to.equal(14n);
      expect(await votes.QUORUM_PERCENT()).to.equal(20n);
    });
  });

  describe("createProposal", function () {
    it("stores the proposal and freezes the member count", async function () {
      await expect(createProposal())
        .to.emit(votes, "ProposalCreated")
        .withArgs(0, proposalManager.address, (await time.latest()) + 7 * DAY + 1);

      const proposal = await votes.getProposal(0);
      expect(proposal.creator).to.equal(proposalManager.address);
      expect(proposal.title).to.equal(TITLE);
      expect(proposal.description).to.equal(DESCRIPTION);
      expect(proposal.status).to.equal(Status.Active);
      expect(proposal.totalMembersAtCreation).to.equal(5n); // admin + alice + bob + carol + dave
      expect(proposal.votingDeadline).to.equal(BigInt(await time.latest()) + BigInt(7 * DAY));

      expect(await votes.proposalCount()).to.equal(1n);
    });

    it("lets the admin create proposals too", async function () {
      await createProposal(admin);
      expect((await votes.getProposal(0)).creator).to.equal(admin.address);
    });

    it("rejects members, auditors and outsiders", async function () {
      for (const signer of [alice, auditor, outsider]) {
        await expect(createProposal(signer)).to.be.revertedWith(
          "Only proposal managers or admins can create proposals",
        );
      }
    });

    it("validates the texts and the voting window", async function () {
      const create = (title: string, description: string, days: number = 7) =>
        votes.connect(proposalManager).createProposal(title, description, days);

      await expect(create("", "x")).to.be.revertedWith("The title must not be empty");
      await expect(create("t".repeat(101), "x")).to.be.revertedWith("The title is too long");
      await expect(create("t", "")).to.be.revertedWith("The description must not be empty");
      await expect(create("t", "d".repeat(2001))).to.be.revertedWith("The description is too long");
      await expect(create("t", "d", 2)).to.be.revertedWith("Invalid voting days");
      await expect(create("t", "d", 15)).to.be.revertedWith("Invalid voting days");

      // the boundaries work
      await create("t".repeat(100), "d".repeat(2000), 3);
      await create("t", "d", 14);
      expect((await votes.getProposal(0)).votingDeadline).to.equal(BigInt(await time.latest()) + BigInt(3 * DAY) - 1n);
      expect((await votes.getProposal(1)).votingDeadline).to.equal(BigInt(await time.latest()) + BigInt(14 * DAY));
    });

    it("takes a snapshot: joining later does not raise the quorum", async function () {
      await createProposal();

      const [, , , , , , , , , newMember] = await ethers.getSigners();
      await dao.connect(newMember).joinDao();

      expect((await votes.getProposal(0)).totalMembersAtCreation).to.equal(5n);
    });

    it("lists every proposal in order", async function () {
      await createProposal();
      await createProposal();

      const all = await votes.getAllProposals();
      expect(all.map(p => Number(p.id))).to.deep.equal([0, 1]);
    });

    it("fails for a proposal that does not exist", async function () {
      await expect(votes.getProposal(5)).to.be.revertedWith("The proposal does not exist");
      await expect(votes.getVote(5, alice.address)).to.be.revertedWith("The proposal does not exist");
    });
  });

  describe("castVote", function () {
    beforeEach(activeProposal);

    it("lets members vote For and keeps the choice", async function () {
      await expect(votes.connect(alice).castVote(0, Choice.For))
        .to.emit(votes, "VoteCast")
        .withArgs(0, alice.address, Choice.For);

      expect((await votes.getProposal(0)).forVotes).to.equal(1n);
      const [hasVoted, choice] = await votes.getVote(0, alice.address);
      expect(hasVoted).to.equal(true);
      expect(choice).to.equal(Choice.For);
    });

    it("counts Against and Abstain separately", async function () {
      await votes.connect(alice).castVote(0, Choice.For);
      await votes.connect(bob).castVote(0, Choice.Against);
      await votes.connect(carol).castVote(0, Choice.Abstain);

      const proposal = await votes.getProposal(0);
      expect(proposal.forVotes).to.equal(1n);
      expect(proposal.againstVotes).to.equal(1n);
      expect(proposal.abstainVotes).to.equal(1n);
    });

    it("lets the admin vote on a proposal they did not create", async function () {
      await votes.connect(admin).castVote(0, Choice.For);
      expect((await votes.getProposal(0)).forVotes).to.equal(1n);
    });

    it("lets the proposal creator vote on their own proposal", async function () {
      // the proposal manager has to also be a member (they joined is not required by the contract)
      await dao.connect(proposalManager).joinDao();

      await votes.connect(proposalManager).castVote(0, Choice.For);
      expect((await votes.getProposal(0)).forVotes).to.equal(1n);
    });

    it("rejects outsiders and non-members (auditor who never joined)", async function () {
      for (const signer of [outsider, auditor, proposalManager]) {
        await expect(votes.connect(signer).castVote(0, Choice.For)).to.be.revertedWith("Only members can vote");
      }
    });

    it("rejects a second vote from the same wallet", async function () {
      await votes.connect(alice).castVote(0, Choice.For);
      await expect(votes.connect(alice).castVote(0, Choice.Against)).to.be.revertedWith("You already voted");
    });

    it("rejects a vote after the deadline", async function () {
      await time.increase(7 * DAY + 1);
      await expect(votes.connect(alice).castVote(0, Choice.For)).to.be.revertedWith("Voting has ended");
    });

    it("rejects a vote on a finalized proposal", async function () {
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      await expect(votes.connect(alice).castVote(0, Choice.For)).to.be.revertedWith("The proposal is not active");
    });
  });

  describe("finalize", function () {
    beforeEach(activeProposal);

    it("cannot be called while voting is open", async function () {
      await expect(votes.finalize(0)).to.be.revertedWith("Voting is still open");
    });

    it("rejects a proposal when against wins", async function () {
      await votes.connect(alice).castVote(0, Choice.For);
      await votes.connect(bob).castVote(0, Choice.Against);
      await votes.connect(carol).castVote(0, Choice.Against);
      await time.increase(7 * DAY + 1);

      await expect(votes.finalize(0)).to.emit(votes, "ProposalStatusChanged").withArgs(0, Status.Rejected);
      expect((await votes.getProposal(0)).status).to.equal(Status.Rejected);
    });

    it("rejects a proposal when the vote is tied (For does not strictly win)", async function () {
      await votes.connect(alice).castVote(0, Choice.For);
      await votes.connect(bob).castVote(0, Choice.Against);
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      expect((await votes.getProposal(0)).status).to.equal(Status.Rejected);
    });

    it("approves a proposal when For wins and quorum is met", async function () {
      // 5 members, quorum = 1 vote. For wins strictly.
      await votes.connect(alice).castVote(0, Choice.For);
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      expect((await votes.getProposal(0)).status).to.equal(Status.Approved);
    });

    it("flags QuorumNotReached when nobody votes", async function () {
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      expect((await votes.getProposal(0)).status).to.equal(Status.QuorumNotReached);
    });

    it("counts Abstain towards the quorum", async function () {
      // 10 members at creation, quorum = 2 votes. 2 abstains reach it: For does not beat Against (both 0), so Rejected.
      const [, , , , , , , , , , e, f, g, h, i] = await ethers.getSigners();
      for (const member of [e, f, g, h, i]) await dao.connect(member).joinDao();
      await createProposal(); // id 1, created with 10 members
      await votes.connect(e).castVote(1, Choice.Abstain);
      await votes.connect(f).castVote(1, Choice.Abstain);
      await time.increase(7 * DAY + 1);
      await votes.finalize(1);

      expect((await votes.getProposal(1)).status).to.equal(Status.Rejected);
    });

    it("does not round the quorum down: exactly 20% is enough, 19.99% is not", async function () {
      // 5 members at creation. 20% of 5 = 1. One vote reaches the quorum.
      await votes.connect(alice).castVote(0, Choice.Abstain);
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      // One abstain is enough for quorum. For (0) does not beat Against (0), so Rejected (not QuorumNotReached).
      expect((await votes.getProposal(0)).status).to.equal(Status.Rejected);
    });

    it("rejects a QuorumNotReached when participation falls short", async function () {
      // 10 members at creation, quorum = 2 votes. Only one abstain: not enough.
      const [, , , , , , , , , , e, f, g, h, i] = await ethers.getSigners();
      for (const member of [e, f, g, h, i]) await dao.connect(member).joinDao();
      await createProposal(); // id 1
      await votes.connect(e).castVote(1, Choice.For);
      await time.increase(7 * DAY + 1);
      await votes.finalize(1);

      expect((await votes.getProposal(1)).status).to.equal(Status.QuorumNotReached);
    });

    it("cannot finalize twice", async function () {
      await time.increase(7 * DAY + 1);
      await votes.finalize(0);

      await expect(votes.finalize(0)).to.be.revertedWith("The proposal is not active");
    });

    it("can be triggered by anyone", async function () {
      await time.increase(7 * DAY + 1);
      await votes.connect(outsider).finalize(0);

      expect((await votes.getProposal(0)).status).to.equal(Status.QuorumNotReached);
    });
  });

  describe("roles stay in sync with the DAO", function () {
    it("stops accepting proposals from someone whose role was revoked", async function () {
      await dao.connect(admin).deleteRole(PROPOSAL_MANAGER_ROLE, proposalManager.address);
      await expect(createProposal()).to.be.revertedWith("Only proposal managers or admins can create proposals");
    });

    it("stops accepting votes from someone whose membership was revoked", async function () {
      await activeProposal();
      await dao.connect(admin).deleteRole(ethers.id("USER_ROLE"), alice.address);
      await expect(votes.connect(alice).castVote(0, Choice.For)).to.be.revertedWith("Only members can vote");
    });

    it("does not care about task managers for proposals", async function () {
      await dao.connect(admin).registerRole(TASK_MANAGER_ROLE, outsider.address);
      await expect(createProposal(outsider)).to.be.revertedWith(
        "Only proposal managers or admins can create proposals",
      );
    });
  });
});
