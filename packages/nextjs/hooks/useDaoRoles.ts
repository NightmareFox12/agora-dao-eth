import { useAccount } from "wagmi";
import { ROLE_LABELS } from "~~/constants/roles";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Roles the connected user has inside the current DAO. */
export const useDaoRoles = () => {
  const { address } = useAccount();
  const { daoAddress } = useDaoStore();

  const enabled = address !== undefined && daoAddress !== "";

  // one call per role (always the same 5 hooks, in the same order)
  const results = ROLE_LABELS.map(({ role }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useScaffoldReadContract({
      contractName: "AgoraDao",
      functionName: "isRole",
      args: [role, address],
      contractAddress: daoAddress,
      query: { enabled },
    }),
  );

  const roles = ROLE_LABELS.filter((_, i) => results[i].data === true);
  const isLoading = enabled && results.some(x => x.isLoading);

  return {
    roles,
    /** The most important role the user has. */
    mainRole: roles[0],
    isAdmin: roles.some(x => x.label === "Administrador"),
    /** Who can publish tasks (same rule as AgoraTasks.createTask). */
    canCreateTasks: roles.some(x => x.label === "Administrador" || x.label === "Gestor de tareas"),
    isMember: roles.some(x => x.label === "Miembro"),
    /** Who can resolve disputes (same rule as AgoraTasks.resolveDispute, before excluding the people in the task). */
    canArbitrate: roles.some(x => x.label === "Administrador" || x.label === "Auditor"),
    isLoading,
  };
};
