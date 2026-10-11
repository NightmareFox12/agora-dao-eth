import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Address of the task module of the DAO the user is inside (each DAO has its own). */
export const useTasksAddress = () => {
  const { daoAddress } = useDaoStore();

  const { data: tasksAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "tasks",
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" },
  });

  return tasksAddress;
};
