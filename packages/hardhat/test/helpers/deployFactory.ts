import { ethers } from "hardhat";
import { AgoraDaoFactory } from "../../typechain-types";

/** Deploys the implementations every DAO clones, and the factory that creates the DAOs. */
export const deployFactory = async (): Promise<AgoraDaoFactory> => {
  const [owner] = await ethers.getSigners();

  const daoImplementation = await (await ethers.getContractFactory("AgoraDao")).deploy();
  const tasksImplementation = await (await ethers.getContractFactory("AgoraTasks")).deploy();

  const factory = await (
    await ethers.getContractFactory("AgoraDaoFactory")
  ).deploy(owner.address, await daoImplementation.getAddress(), await tasksImplementation.getAddress());
  await factory.waitForDeployment();

  return factory as AgoraDaoFactory;
};
