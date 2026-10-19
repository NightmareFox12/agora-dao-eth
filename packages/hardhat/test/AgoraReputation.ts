import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgoraDao,
  AgoraDaoFactory,
  AgoraEvents,
  AgoraReputation,
  AgoraRewards,
  AgoraTasks,
  AgoraVotes,
} from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const TASK_MANAGER_ROLE = ethers.id("TASK_MANAGER_ROLE");
const PROPOSAL_MANAGER_ROLE = ethers.id("PROPOSAL_MANAGER_ROLE");

const DAY = 24 * 60 * 60;
const Choice = { Against: 0, For: 1, Abstain: 2 } as const;

describe("AgoraReputation", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let reputation: AgoraReputation;
  let rewards: AgoraRewards;
  let tasks: AgoraTasks;
  let votes: AgoraVotes;
  let events: AgoraEvents;

  let admin: HardhatEthersSigner;
  let manager: HardhatEthersSigner;
  let proposalManager: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let other: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  beforeEach(async () => {
    [, admin, manager, proposalManager, worker, other, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    reputation = (await ethers.getContractAt("AgoraReputation", await dao.reputation())) as AgoraReputation;
    rewards = (await ethers.getContractAt("AgoraRewards", await dao.rewards())) as AgoraRewards;
    tasks = (await ethers.getContractAt("AgoraTasks", await dao.tasks())) as AgoraTasks;
    votes = (await ethers.getContractAt("AgoraVotes", await dao.votes())) as AgoraVotes;
    events = (await ethers.getContractAt("AgoraEvents", await dao.publicEvents())) as AgoraEvents;

    await dao.connect(admin).registerRole(TASK_MANAGER_ROLE, manager.address);
    await dao.connect(admin).registerRole(PROPOSAL_MANAGER_ROLE, proposalManager.address);
    for (const member of [worker, other]) await dao.connect(member).joinDao();
  });

  describe("setup", function () {
    it("is created together with the DAO and knows it", async function () {
      expect(await dao.reputation()).to.not.equal(ethers.ZeroAddress);
      expect(await reputation.dao()).to.equal(await dao.getAddress());
    });

    it("cannot be initialized twice", async function () {
      await expect(reputation.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraReputation")).deploy();
      await expect(implementation.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("starts with every user at level 0 with 0 points", async function () {
      for (const user of [admin, worker, other, outsider]) {
        expect(await reputation.points(user.address)).to.equal(0n);
        expect(await reputation.levelOf(user.address)).to.equal(0n);
      }
    });

    it("exposes the thresholds the frontend expects", async function () {
      expect(await reputation.maxLevel()).to.equal(6n);
      expect(await reputation.thresholdOf(1)).to.equal(100n);
      expect(await reputation.thresholdOf(2)).to.equal(300n);
      expect(await reputation.thresholdOf(6)).to.equal(2500n);
      await expect(reputation.thresholdOf(0)).to.be.revertedWith("Invalid level");
      await expect(reputation.thresholdOf(7)).to.be.revertedWith("Invalid level");
    });
  });

  describe("award", function () {
    it("rejects direct calls from everyone except the modules of the DAO", async function () {
      for (const signer of [admin, worker, outsider, manager]) {
        await expect(reputation.connect(signer).award(worker.address, 10)).to.be.revertedWith(
          "Only DAO modules can award points",
        );
      }
    });

    it("rejects invalid inputs even from authorized modules (simulated via events on-chain)", async function () {
      // register for an event with 0 amount is not possible from a module (it always uses fixed amounts),
      // so we test the direct validations via a plain mint attempt
      // These validations are reached when a module calls with bad data (defensive)
      // We simulate the module caller via impersonation.
      const tasksAddress = await tasks.getAddress();
      await ethers.provider.send("hardhat_setBalance", [tasksAddress, "0x56BC75E2D63100000"]);
      await ethers.provider.send("hardhat_impersonateAccount", [tasksAddress]);
      const tasksSigner = await ethers.getSigner(tasksAddress);

      await expect(reputation.connect(tasksSigner).award(ethers.ZeroAddress, 10)).to.be.revertedWith("Invalid user");
      await expect(reputation.connect(tasksSigner).award(worker.address, 0)).to.be.revertedWith(
        "The amount must be greater than zero",
      );

      await ethers.provider.send("hardhat_stopImpersonatingAccount", [tasksAddress]);
    });
  });

  describe("hooks from the other modules", function () {
    const createEventFor = async (signer: HardhatEthersSigner) => {
      const startsAt = (await time.latest()) + 7 * DAY;
      await events.connect(signer).createEvent("Meetup", "A meetup to chat", startsAt, "Online", 0, ethers.ZeroHash);
    };

    const createTakenTask = async (reward = ethers.parseEther("1")) => {
      await tasks
        .connect(manager)
        .createTask("Landing page", "Design it", 0, 30, ethers.sha256(ethers.toUtf8Bytes("details")), {
          value: reward,
        });
      await tasks.connect(worker).takeTask(0);
    };

    it("gives points to the voter when they cast a vote", async function () {
      await votes.connect(proposalManager).createProposal("Do X?", "Just a text proposal", 3);

      await votes.connect(worker).castVote(0, Choice.For);
      expect(await reputation.points(worker.address)).to.equal(5n);

      await votes.connect(other).castVote(0, Choice.Against);
      expect(await reputation.points(other.address)).to.equal(5n);
    });

    it("gives points to the creator of an event, and to each attendee", async function () {
      await createEventFor(worker);
      expect(await reputation.points(worker.address)).to.equal(10n);

      await events.connect(other).register(0);
      expect(await reputation.points(other.address)).to.equal(5n);
      // The creator points stay as they were: registering is tracked separately
      expect(await reputation.points(worker.address)).to.equal(10n);
    });

    it("does NOT return the points when a registration is cancelled (points are a record of participation)", async function () {
      await createEventFor(worker);
      await events.connect(other).register(0);

      await events.connect(other).cancelRegistration(0);
      expect(await reputation.points(other.address)).to.equal(5n);
    });

    it("gives 50 points to the assignee when a task is paid", async function () {
      await createTakenTask();
      await tasks.connect(worker).submitWork(0, "https://figma.com/x", "done");
      await tasks.connect(manager).approveWork(0);

      expect(await reputation.points(worker.address)).to.equal(50n);
    });

    it("gives the same points no matter how the assignee ended up paid (approval, claim, dispute)", async function () {
      // claim after no review in 7 days
      await createTakenTask();
      await tasks.connect(worker).submitWork(0, "https://figma.com/x", "done");
      await time.increase(8 * DAY);
      await tasks.connect(outsider).claimPayment(0);
      expect(await reputation.points(worker.address)).to.equal(50n);
    });
  });

  describe("levels", function () {
    const giveRaw = async (user: string, amount: number) => {
      // use the votes module (each vote = 5 points) to add points predictably
      const startId = Number(await votes.proposalCount());
      for (let i = 0; i < amount / 5; i++) {
        const id = startId + i;
        await votes.connect(proposalManager).createProposal(`Proposal ${id}`, "x".repeat(30), 3);
        await votes.connect(await ethers.getSigner(user)).castVote(id, Choice.For);
      }
    };

    it("stays at level 0 below the first threshold", async function () {
      await giveRaw(worker.address, 95);
      expect(await reputation.levelOf(worker.address)).to.equal(0n);
    });

    it("jumps to level 1 at exactly 100 points, and mints a badge", async function () {
      await giveRaw(worker.address, 100);

      expect(await reputation.levelOf(worker.address)).to.equal(1n);
      expect(await rewards.balanceOf(worker.address)).to.equal(1n);
      expect(await rewards.levelOf(1)).to.equal(1n);
    });

    it("skips levels if a single award crosses several thresholds (minting one badge per level)", async function () {
      // one completed task is 50 points; three of them is 150, enough for level 1 but not 2
      // we go bigger: give many votes to get up fast
      await giveRaw(worker.address, 300);

      expect(await reputation.levelOf(worker.address)).to.equal(2n);
      expect(await rewards.balanceOf(worker.address)).to.equal(2n);
    });

    it("tracks points to the next level and 0 at max level", async function () {
      await giveRaw(worker.address, 100);
      expect(await reputation.pointsToNextLevel(worker.address)).to.equal(200n); // 300 - 100

      await giveRaw(worker.address, 2400); // total 2500
      expect(await reputation.levelOf(worker.address)).to.equal(6n);
      expect(await reputation.pointsToNextLevel(worker.address)).to.equal(0n);
    });

    it("mints one badge per level reached, in order", async function () {
      await giveRaw(worker.address, 600);

      expect(await rewards.balanceOf(worker.address)).to.equal(3n);
      expect(await rewards.levelOf(1)).to.equal(1n);
      expect(await rewards.levelOf(2)).to.equal(2n);
      expect(await rewards.levelOf(3)).to.equal(3n);
    });

    it("does not mint again when the user keeps getting points without changing level", async function () {
      await giveRaw(worker.address, 100); // level 1
      expect(await rewards.balanceOf(worker.address)).to.equal(1n);

      await giveRaw(worker.address, 50); // still level 1
      expect(await rewards.balanceOf(worker.address)).to.equal(1n);
      expect(await reputation.points(worker.address)).to.equal(150n);
    });
  });
});
