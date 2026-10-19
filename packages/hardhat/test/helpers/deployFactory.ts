import { ethers } from "hardhat";
import { AgoraDaoFactory } from "../../typechain-types";

/** Deploys the implementations every DAO clones, and the factory that creates the DAOs. */
export const deployFactory = async (): Promise<AgoraDaoFactory> => {
  const [owner] = await ethers.getSigners();

  const daoImplementation = await (await ethers.getContractFactory("AgoraDao")).deploy();
  const tasksImplementation = await (await ethers.getContractFactory("AgoraTasks")).deploy();
  const votesImplementation = await (await ethers.getContractFactory("AgoraVotes")).deploy();
  const treasuryImplementation = await (await ethers.getContractFactory("AgoraTreasury")).deploy();
  const eventsImplementation = await (await ethers.getContractFactory("AgoraEvents")).deploy();
  const reputationImplementation = await (await ethers.getContractFactory("AgoraReputation")).deploy();
  const rewardsImplementation = await (await ethers.getContractFactory("AgoraRewards")).deploy();

  const factory = await (
    await ethers.getContractFactory("AgoraDaoFactory")
  ).deploy(
    owner.address,
    await daoImplementation.getAddress(),
    await tasksImplementation.getAddress(),
    await votesImplementation.getAddress(),
    await treasuryImplementation.getAddress(),
    await eventsImplementation.getAddress(),
    await reputationImplementation.getAddress(),
    await rewardsImplementation.getAddress(),
  );
  await factory.waitForDeployment();

  return factory as AgoraDaoFactory;
};
