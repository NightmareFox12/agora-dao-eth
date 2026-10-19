import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgoraDao, AgoraDaoFactory, AgoraReputation, AgoraRewards, AgoraVotes } from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const PROPOSAL_MANAGER_ROLE = ethers.id("PROPOSAL_MANAGER_ROLE");
const Choice = { Against: 0, For: 1, Abstain: 2 } as const;

describe("AgoraRewards", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let reputation: AgoraReputation;
  let rewards: AgoraRewards;
  let votes: AgoraVotes;

  let admin: HardhatEthersSigner;
  let proposalManager: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let other: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  const earnLevel1 = async (user: HardhatEthersSigner) => {
    // 20 votes * 5 points = 100 → level 1
    for (let i = 0; i < 20; i++) {
      await votes.connect(proposalManager).createProposal(`Proposal ${i}`, "x".repeat(30), 3);
      await votes.connect(user).castVote(i, Choice.For);
    }
  };

  beforeEach(async () => {
    [, admin, proposalManager, worker, other, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    reputation = (await ethers.getContractAt("AgoraReputation", await dao.reputation())) as AgoraReputation;
    rewards = (await ethers.getContractAt("AgoraRewards", await dao.rewards())) as AgoraRewards;
    votes = (await ethers.getContractAt("AgoraVotes", await dao.votes())) as AgoraVotes;

    await dao.connect(admin).registerRole(PROPOSAL_MANAGER_ROLE, proposalManager.address);
    for (const member of [worker, other]) await dao.connect(member).joinDao();
  });

  describe("setup", function () {
    it("has the right name and symbol on the clones (constructor runs on the implementation only)", async function () {
      expect(await rewards.name()).to.equal("Agora Reputation Badge");
      expect(await rewards.symbol()).to.equal("AGORA-BADGE");
    });

    it("knows its DAO and its reputation module", async function () {
      expect(await rewards.dao()).to.equal(await dao.getAddress());
      expect(await rewards.reputation()).to.equal(await reputation.getAddress());
    });

    it("cannot be initialized twice", async function () {
      await expect(rewards.initialize(outsider.address, outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraRewards")).deploy();
      await expect(implementation.initialize(outsider.address, outsider.address)).to.be.revertedWith(
        "Already initialized",
      );
    });
  });

  describe("minting", function () {
    it("only the reputation module can mint directly", async function () {
      for (const signer of [admin, worker, outsider, proposalManager]) {
        await expect(rewards.connect(signer).mint(worker.address, 1)).to.be.revertedWith(
          "Only the reputation module can mint",
        );
      }
    });

    it("gives one badge per level reached (through the reputation hook)", async function () {
      await earnLevel1(worker);

      expect(await rewards.balanceOf(worker.address)).to.equal(1n);
      expect(await rewards.ownerOf(1)).to.equal(worker.address);
      expect(await rewards.levelOf(1)).to.equal(1n);
      expect(await rewards.totalMinted()).to.equal(1n);
    });

    it("auto-increments token ids across different users", async function () {
      await earnLevel1(worker);
      await earnLevel1(other);

      expect(await rewards.ownerOf(1)).to.equal(worker.address);
      expect(await rewards.ownerOf(2)).to.equal(other.address);
    });
  });

  describe("soulbound", function () {
    beforeEach(async () => {
      await earnLevel1(worker);
    });

    it("rejects a transferFrom", async function () {
      await expect(rewards.connect(worker).transferFrom(worker.address, other.address, 1)).to.be.revertedWith(
        "Reputation badges are soulbound",
      );
    });

    it("rejects a safeTransferFrom", async function () {
      await expect(
        rewards.connect(worker)["safeTransferFrom(address,address,uint256)"](worker.address, other.address, 1),
      ).to.be.revertedWith("Reputation badges are soulbound");
    });

    it("rejects an approval + transfer attempt", async function () {
      await rewards.connect(worker).approve(other.address, 1);
      await expect(rewards.connect(other).transferFrom(worker.address, other.address, 1)).to.be.revertedWith(
        "Reputation badges are soulbound",
      );
    });
  });

  describe("tokenURI", function () {
    beforeEach(async () => {
      await earnLevel1(worker);
    });

    it("returns a data URI with embedded JSON and SVG", async function () {
      const uri = await rewards.tokenURI(1);
      expect(uri.startsWith("data:application/json;base64,")).to.equal(true);

      const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
      expect(json.name).to.include("Nivel 1");
      expect(json.description).to.include("soulbound");
      expect(json.image.startsWith("data:image/svg+xml;base64,")).to.equal(true);

      const svg = Buffer.from(json.image.split(",")[1], "base64").toString("utf8");
      expect(svg).to.include("<svg");
      expect(svg).to.include("</svg>");
      expect(svg).to.include("Agora DAO");
    });

    it("fails for a token that does not exist", async function () {
      await expect(rewards.tokenURI(999)).to.be.reverted;
    });
  });
});
