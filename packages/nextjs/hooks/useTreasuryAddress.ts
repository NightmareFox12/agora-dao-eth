import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Address of the treasury of the DAO the user is inside (each DAO has its own). */
export const useTreasuryAddress = () => {
  const { daoAddress } = useDaoStore();

  const { data: treasuryAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "treasury",
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" },
  });

  return treasuryAddress;
};
