import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Data of the DAO the user is currently inside (the one stored by DaoSetup). */
export const useCurrentDao = () => {
  const { daoAddress } = useDaoStore();

  const { data: daos, isLoading: daosLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaos",
  });

  const { data: daoCategories } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaoCategories",
  });

  const dao = useMemo(
    () => daos?.find(x => x.daoAddress.toLowerCase() === daoAddress.toLowerCase()),
    [daos, daoAddress],
  );

  const categories = useMemo(
    () =>
      (dao?.categoryIDs ?? []).flatMap(id => {
        const name = daoCategories?.[Number(id)];
        return name === undefined ? [] : [{ id: Number(id), name }];
      }),
    [dao, daoCategories],
  );

  return { daoAddress, dao, categories, isLoading: daoAddress === "" || daosLoading };
};
