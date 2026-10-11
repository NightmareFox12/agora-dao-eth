import { expect } from "chai";
import { ethers } from "hardhat";
import { AgoraDaoFactory } from "../typechain-types";

describe("AgoraDaoFactory", function () {
  let factory: AgoraDaoFactory;

  beforeEach(async () => {
    const [owner] = await ethers.getSigners();
    const factoryContract = await ethers.getContractFactory("AgoraDaoFactory");
    factory = (await factoryContract.deploy(owner.address)) as AgoraDaoFactory;
    await factory.waitForDeployment();
  });

  describe("createDao categories", function () {
    it("stores every selected category id", async function () {
      await factory.createDao("ETH Force", "A DAO for testing", [0, 2, 3], "");

      const daos = await factory.getAllDaos();
      expect(daos.length).to.equal(1);
      expect(daos[0].categoryIDs.map(Number)).to.deep.equal([0, 2, 3]);
    });

    it("accepts a single category", async function () {
      await factory.createDao("ETH Force", "A DAO for testing", [1], "");

      const daos = await factory.getAllDaos();
      expect(daos[0].categoryIDs.map(Number)).to.deep.equal([1]);
    });

    it("rejects an empty category list", async function () {
      await expect(factory.createDao("ETH Force", "A DAO for testing", [], "")).to.be.revertedWith(
        "At least one category is required",
      );
    });

    it("rejects more than MAX_CATEGORIES categories", async function () {
      await factory.addDaoCategory("EXTRA");

      await expect(factory.createDao("ETH Force", "A DAO for testing", [0, 1, 2, 4], "")).to.be.revertedWith(
        "Too many categories",
      );
    });

    it("rejects duplicated categories", async function () {
      await expect(factory.createDao("ETH Force", "A DAO for testing", [1, 1], "")).to.be.revertedWith(
        "Duplicate category",
      );
    });

    it("rejects an unknown category id", async function () {
      await expect(factory.createDao("ETH Force", "A DAO for testing", [0, 99], "")).to.be.revertedWith(
        "Invalid category ID.",
      );
    });
  });
});
