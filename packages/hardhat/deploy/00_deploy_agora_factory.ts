import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the AgoraDaoFactory using the deployer account as its owner. It receives the implementations
 * that the DAOs clone, which are deployed first by 01_deploy_agora_dao.ts.
 *
 * On localhost the deployer account is the one that comes with Hardhat, which is already funded.
 * When deploying to live networks (e.g `yarn deploy --network sepolia`) it needs balance to pay for gas.
 * Use `yarn generate` or `yarn account:import` to set the deployer, and `yarn account` to check its balance.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAgoraDaoFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  const daoImplementation = await get("AgoraDao");
  const tasksImplementation = await get("AgoraTasks");
  const votesImplementation = await get("AgoraVotes");
  const treasuryImplementation = await get("AgoraTreasury");
  const eventsImplementation = await get("AgoraEvents");
  const reputationImplementation = await get("AgoraReputation");
  const rewardsImplementation = await get("AgoraRewards");

  await deploy("AgoraDaoFactory", {
    from: deployer,
    args: [
      deployer,
      daoImplementation.address,
      tasksImplementation.address,
      votesImplementation.address,
      treasuryImplementation.address,
      eventsImplementation.address,
      reputationImplementation.address,
      rewardsImplementation.address,
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
};

export default deployAgoraDaoFactory;

// Runs after the implementations, whatever the file names are.
deployAgoraDaoFactory.dependencies = ["AgoraImplementations"];

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AgoraDaoFactory
deployAgoraDaoFactory.tags = ["AgoraDaoFactory"];
