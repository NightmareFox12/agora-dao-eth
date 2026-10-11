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

  describe("createDao text limits", function () {
    it("accepts a name and description at the maximum length", async function () {
      const name = "n".repeat(Number(await factory.MAX_NAME_LENGTH()));
      const description = "d".repeat(Number(await factory.MAX_DESCRIPTION_LENGTH()));

      await factory.createDao(name, description, [0], "");
      expect((await factory.getAllDaos()).length).to.equal(1);
    });

    it("rejects a name longer than MAX_NAME_LENGTH", async function () {
      const name = "n".repeat(Number(await factory.MAX_NAME_LENGTH()) + 1);

      await expect(factory.createDao(name, "A DAO for testing", [0], "")).to.be.revertedWith(
        "The name of the DAO is very long",
      );
    });

    it("rejects a description longer than MAX_DESCRIPTION_LENGTH", async function () {
      const description = "d".repeat(Number(await factory.MAX_DESCRIPTION_LENGTH()) + 1);

      await expect(factory.createDao("ETH Force", description, [0], "")).to.be.revertedWith(
        "The description of the DAO is very long",
      );
    });

    // The frontend form (dao.scheme.ts) hardcodes these numbers: if this test fails, update both places.
    it("keeps the limits the frontend form expects", async function () {
      expect(await factory.MAX_NAME_LENGTH()).to.equal(50);
      expect(await factory.MAX_DESCRIPTION_LENGTH()).to.equal(500);
      expect(await factory.MAX_CATEGORIES()).to.equal(3);
    });
  });
});
