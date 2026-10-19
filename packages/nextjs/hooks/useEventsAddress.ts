import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Address of the events module of the DAO the user is inside (each DAO has its own). */
export const useEventsAddress = () => {
  const { daoAddress } = useDaoStore();

  const { data: eventsAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "publicEvents",
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" },
  });

  return eventsAddress;
};
