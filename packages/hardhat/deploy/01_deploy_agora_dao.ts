import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the implementations that every DAO clones: the DAO itself and each of its modules.
 * The factory (00_deploy_agora_factory.ts) needs their addresses, so it depends on this script.
 *
 * They are not used directly: each DAO gets its own clone. Deploying them here also registers their ABIs,
 * which the frontend needs to talk to the clones.
 *
 * To add a module: deploy it here, give it to the factory, and clone it in AgoraDaoFactory.createDao.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployImplementations: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  for (const contract of [
    "AgoraDao",
    "AgoraTasks",
    "AgoraVotes",
    "AgoraTreasury",
    "AgoraEvents",
    "AgoraReputation",
    "AgoraRewards",
  ]) {
    await deploy(contract, {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  }
};

export default deployImplementations;

// e.g. yarn deploy --tags AgoraImplementations
deployImplementations.tags = ["AgoraImplementations"];
