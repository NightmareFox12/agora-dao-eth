import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Address of the voting module of the DAO the user is inside (each DAO has its own). */
export const useVotesAddress = () => {
  const { daoAddress } = useDaoStore();

  const { data: votesAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "votes",
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" },
  });

  return votesAddress;
};
