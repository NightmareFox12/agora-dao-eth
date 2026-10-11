import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgoraDao, AgoraDaoFactory } from "../typechain-types";

const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const AUDITOR_ROLE = ethers.id("AUDITOR_ROLE");
const TASK_MANAGER_ROLE = ethers.id("TASK_MANAGER_ROLE");
const PROPOSAL_MANAGER_ROLE = ethers.id("PROPOSAL_MANAGER_ROLE");
const USER_ROLE = ethers.id("USER_ROLE");

describe("AgoraDao roles", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let creator: HardhatEthersSigner;
  let auditor: HardhatEthersSigner;
  let member: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;
  let target: HardhatEthersSigner;

  beforeEach(async () => {
    const [owner, ...signers] = await ethers.getSigners();
    [creator, auditor, member, outsider, target] = signers;

    const factoryContract = await ethers.getContractFactory("AgoraDaoFactory");
    factory = (await factoryContract.deploy(owner.address)) as AgoraDaoFactory;
    await factory.waitForDeployment();

    await factory.connect(creator).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();
    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;

    await dao.connect(creator).registerRole(AUDITOR_ROLE, auditor.address);
  });

  describe("admin", function () {
    it("is only the creator, never the factory", async function () {
      expect(await dao.isRole(DEFAULT_ADMIN_ROLE, creator.address)).to.equal(true);
      expect(await dao.isRole(DEFAULT_ADMIN_ROLE, await factory.getAddress())).to.equal(false);
    });

    it("lists the creator as an admin", async function () {
      expect(await dao.getMemberByRole(DEFAULT_ADMIN_ROLE)).to.deep.equal([creator.address]);
    });
  });

  describe("an auditor cannot escalate privileges", function () {
    it("cannot make anybody admin (registerRole)", async function () {
      await expect(dao.connect(auditor).registerRole(DEFAULT_ADMIN_ROLE, outsider.address)).to.be.revertedWith(
        "Only admin can assign DEFAULT_ADMIN_ROLE",
      );
    });

    it("cannot make anybody admin (registerRoleBatch)", async function () {
      await expect(dao.connect(auditor).registerRoleBatch(DEFAULT_ADMIN_ROLE, [outsider.address])).to.be.revertedWith(
        "Only admin can assign DEFAULT_ADMIN_ROLE",
      );
    });

    it("cannot create other auditors", async function () {
      await expect(dao.connect(auditor).registerRole(AUDITOR_ROLE, outsider.address)).to.be.revertedWith(
        "Only admin can assign AUDITOR_ROLE",
      );
    });

    it("can still assign the operational roles", async function () {
      await dao.connect(auditor).registerRole(TASK_MANAGER_ROLE, member.address);
      await dao.connect(auditor).registerRoleBatch(PROPOSAL_MANAGER_ROLE, [outsider.address, target.address]);

      expect(await dao.isRole(TASK_MANAGER_ROLE, member.address)).to.equal(true);
      expect(await dao.getMemberByRole(PROPOSAL_MANAGER_ROLE)).to.deep.equal([outsider.address, target.address]);
    });

    it("cannot revoke roles", async function () {
      await dao.connect(creator).registerRole(TASK_MANAGER_ROLE, member.address);

      await expect(dao.connect(auditor).deleteRole(TASK_MANAGER_ROLE, member.address)).to.be.revertedWith(
        "Only admin can revoke roles",
      );
    });
  });

  describe("admin permissions", function () {
    it("can assign another admin", async function () {
      await dao.connect(creator).registerRole(DEFAULT_ADMIN_ROLE, target.address);

      expect(await dao.isRole(DEFAULT_ADMIN_ROLE, target.address)).to.equal(true);
    });

    it("cannot assign a role nobody knows about", async function () {
      await expect(dao.connect(creator).registerRole(ethers.id("MADE_UP_ROLE"), member.address)).to.be.revertedWith(
        "Unknown role",
      );
    });

    it("cannot assign a role to itself", async function () {
      await expect(dao.connect(creator).registerRole(TASK_MANAGER_ROLE, creator.address)).to.be.revertedWith(
        "Caller cannot assign role to self",
      );
    });

    it("cannot assign the same role twice", async function () {
      await dao.connect(creator).registerRole(TASK_MANAGER_ROLE, member.address);

      await expect(dao.connect(creator).registerRole(TASK_MANAGER_ROLE, member.address)).to.be.revertedWith(
        "User already exists",
      );
    });
  });

  describe("OpenZeppelin entry points are closed", function () {
    it("grantRole reverts, even for the admin", async function () {
      await expect(dao.connect(creator).grantRole(AUDITOR_ROLE, outsider.address)).to.be.revertedWith(
        "Use registerRole to assign roles",
      );
    });

    it("revokeRole reverts, even for the admin", async function () {
      await expect(dao.connect(creator).revokeRole(AUDITOR_ROLE, auditor.address)).to.be.revertedWith(
        "Use deleteRole to revoke roles",
      );
    });

    it("renounceRole reverts, so the DAO can never be left without an admin", async function () {
      await expect(dao.connect(creator).renounceRole(DEFAULT_ADMIN_ROLE, creator.address)).to.be.revertedWith(
        "Roles cannot be renounced",
      );
    });
  });

  describe("member lists stay consistent", function () {
    it("removes a member from the middle of the list", async function () {
      await dao
        .connect(creator)
        .registerRoleBatch(TASK_MANAGER_ROLE, [member.address, outsider.address, target.address]);

      await dao.connect(creator).deleteRole(TASK_MANAGER_ROLE, member.address);

      expect(await dao.isRole(TASK_MANAGER_ROLE, member.address)).to.equal(false);
      // swap-and-pop: the last member takes the removed member's place
      expect([...(await dao.getMemberByRole(TASK_MANAGER_ROLE))]).to.deep.equal([target.address, outsider.address]);
    });

    it("lets a removed member be registered again", async function () {
      await dao.connect(creator).registerRole(TASK_MANAGER_ROLE, member.address);
      await dao.connect(creator).deleteRole(TASK_MANAGER_ROLE, member.address);
      await dao.connect(creator).registerRole(TASK_MANAGER_ROLE, member.address);

      expect(await dao.getMemberByRole(TASK_MANAGER_ROLE)).to.deep.equal([member.address]);
    });

    it("tracks users who join the DAO", async function () {
      await dao.connect(member).joinDao();

      expect(await dao.isRole(USER_ROLE, member.address)).to.equal(true);
      expect(await dao.getMemberByRole(USER_ROLE)).to.deep.equal([member.address]);
    });

    it("does not let the creator or a member join twice", async function () {
      await expect(dao.connect(creator).joinDao()).to.be.revertedWith("The owner can't join");

      await dao.connect(member).joinDao();
      await expect(dao.connect(member).joinDao()).to.be.revertedWith("User already joined");
    });
  });

  describe("factory user counter", function () {
    it("counts the creator and every user who joins", async function () {
      expect(await factory.userCounter()).to.equal(1n);

      await dao.connect(member).joinDao();
      expect(await factory.userCounter()).to.equal(2n);
    });

    it("cannot be inflated by outsiders", async function () {
      await expect(factory.connect(outsider).addUserCounter(target.address)).to.be.revertedWith(
        "Only DAOs created by this factory",
      );
      expect(await factory.userCounter()).to.equal(1n);
    });
  });
});
