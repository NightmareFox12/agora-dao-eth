import { useMemo } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

/** Addresses of the reputation and rewards modules of the current DAO. */
export const useReputationAddresses = () => {
  const { daoAddress } = useDaoStore();
  const enabled = daoAddress !== "";

  const { data: reputationAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "reputation",
    contractAddress: daoAddress,
    query: { enabled },
  });

  const { data: rewardsAddress } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "rewards",
    contractAddress: daoAddress,
    query: { enabled },
  });

  return { reputationAddress, rewardsAddress };
};

/** Reputation data of `user` in the current DAO: points, level, progress to the next level. */
export const useReputation = (user: string | undefined) => {
  const { reputationAddress } = useReputationAddresses();
  const enabled = reputationAddress !== undefined && user !== undefined;

  const { data: points, isLoading: pointsLoading } = useScaffoldReadContract({
    contractName: "AgoraReputation",
    functionName: "points",
    args: [user],
    contractAddress: reputationAddress,
    query: { enabled },
  });

  const { data: level } = useScaffoldReadContract({
    contractName: "AgoraReputation",
    functionName: "levelOf",
    args: [user],
    contractAddress: reputationAddress,
    query: { enabled },
  });

  const { data: toNext } = useScaffoldReadContract({
    contractName: "AgoraReputation",
    functionName: "pointsToNextLevel",
    args: [user],
    contractAddress: reputationAddress,
    query: { enabled },
  });

  const { data: maxLevel } = useScaffoldReadContract({
    contractName: "AgoraReputation",
    functionName: "maxLevel",
    contractAddress: reputationAddress,
    query: { enabled: reputationAddress !== undefined },
  });

  return useMemo(() => {
    const currentLevel = Number(level ?? 0n);
    const currentPoints = Number(points ?? 0n);
    const remaining = Number(toNext ?? 0n);
    const total = Number(maxLevel ?? 0n);
    // Progress to the next level, 0 at max level
    let progress = 100;
    if (currentLevel < total && remaining > 0) {
      // the start of the current band is thresholds[currentLevel - 1] (or 0)
      const nextTarget = currentPoints + remaining;
      const bandStart = currentLevel === 0 ? 0 : nextTarget - (nextTarget - currentPoints) - 0; // simplified
      const bandSize = nextTarget - bandStart;
      progress = bandSize > 0 ? Math.min(100, ((currentPoints - bandStart) * 100) / bandSize) : 0;
    }

    return {
      points: currentPoints,
      level: currentLevel,
      maxLevel: total,
      pointsToNextLevel: remaining,
      progressPercent: progress,
      isMax: total > 0 && currentLevel >= total,
      isLoading: pointsLoading,
    };
  }, [points, level, toNext, maxLevel, pointsLoading]);
};
