"use client";

import { useEffect, useState } from "react";
import { Medal, Sparkles, Trophy } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Progress } from "~~/components/ui/shadcn/progress";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useReputation, useReputationAddresses } from "~~/hooks/useReputation";
import { LEVEL_META } from "~~/lib/reputation";
import { cn } from "~~/lib/utils";

type Badge = { tokenId: bigint; level: number; image: string | undefined };

/**
 * Decodes a tokenURI returned by AgoraRewards (data:application/json;base64,...). The image is an embedded
 * SVG data URI, which we show straight in an <img>.
 */
const decodeBadgeImage = (tokenUri: string | undefined) => {
  if (tokenUri === undefined) return undefined;
  try {
    const [, encoded] = tokenUri.split("base64,");
    if (encoded === undefined) return undefined;
    const json = JSON.parse(atob(encoded)) as { image?: string };
    return json.image;
  } catch {
    return undefined;
  }
};

const BadgeTile: React.FC<{ tokenId: bigint; rewardsAddress: string }> = ({ tokenId, rewardsAddress }) => {
  const { data: level } = useScaffoldReadContract({
    contractName: "AgoraRewards",
    functionName: "levelOf",
    args: [tokenId],
    contractAddress: rewardsAddress,
  });
  const { data: tokenUri } = useScaffoldReadContract({
    contractName: "AgoraRewards",
    functionName: "tokenURI",
    args: [tokenId],
    contractAddress: rewardsAddress,
  });

  const image = decodeBadgeImage(tokenUri as string | undefined);
  const levelNum = Number(level ?? 0n);
  const meta = LEVEL_META[levelNum];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
        {image !== undefined ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`Nivel ${levelNum}`} className="size-full object-cover" />
        ) : (
          <Skeleton className="size-full" />
        )}
      </div>
      <p className="m-0 text-center text-xs font-medium">{meta?.label ?? `Nivel ${levelNum}`}</p>
    </div>
  );
};

export const ReputationCard: React.FC<{ user: string | undefined }> = ({ user }) => {
  const { reputationAddress, rewardsAddress } = useReputationAddresses();
  const { points, level, maxLevel, pointsToNextLevel, isMax } = useReputation(user);

  const meta = LEVEL_META[level];
  const nextMeta = LEVEL_META[level + 1];

  // Progress bar inside the current level band
  const [progressPercent, setProgressPercent] = useState(0);

  const { data: badgeCount } = useScaffoldReadContract({
    contractName: "AgoraRewards",
    functionName: "balanceOf",
    args: [user],
    contractAddress: rewardsAddress,
    query: { enabled: rewardsAddress !== undefined && user !== undefined },
  });

  const { data: thresholds } = useScaffoldReadContract({
    contractName: "AgoraReputation",
    functionName: "thresholdOf",
    args: [level >= 1 ? level : 1],
    contractAddress: reputationAddress,
    query: { enabled: reputationAddress !== undefined },
  });

  useEffect(() => {
    if (isMax) return setProgressPercent(100);
    const bandStart = level === 0 ? 0 : Number(thresholds ?? 0n);
    const bandEnd = points + pointsToNextLevel;
    const bandSize = bandEnd - bandStart;
    setProgressPercent(bandSize > 0 ? ((points - bandStart) * 100) / bandSize : 0);
  }, [points, pointsToNextLevel, level, isMax, thresholds]);

  // The list of badge token IDs this user owns. ERC-721 does not expose "tokens of owner" by default: we
  // iterate from totalMinted and ask who owns each. For a demo with a handful of badges this is fine.
  const { data: totalMinted } = useScaffoldReadContract({
    contractName: "AgoraRewards",
    functionName: "totalMinted",
    contractAddress: rewardsAddress,
    query: { enabled: rewardsAddress !== undefined },
  });

  const [ownedIds, setOwnedIds] = useState<bigint[]>([]);
  useEffect(() => {
    if (rewardsAddress === undefined || user === undefined || totalMinted === undefined) return;
    const total = Number(totalMinted);
    if (total === 0) {
      setOwnedIds([]);
      return;
    }
    // Scan tokenIds and keep the ones owned by user
    (async () => {
      const { createPublicClient, http, parseAbi } = await import("viem");
      const { hardhat } = await import("viem/chains");
      const client = createPublicClient({ chain: hardhat, transport: http() });
      const abi = parseAbi(["function ownerOf(uint256) view returns (address)"]);

      const owned: bigint[] = [];
      for (let id = 1n; id <= BigInt(total); id++) {
        try {
          const owner = (await client.readContract({
            address: rewardsAddress as `0x${string}`,
            abi,
            functionName: "ownerOf",
            args: [id],
          })) as string;
          if (owner.toLowerCase() === user.toLowerCase()) owned.push(id);
        } catch {
          // token burned or missing: skip
        }
      }
      setOwnedIds(owned);
    })();
  }, [rewardsAddress, user, totalMinted]);

  if (user === undefined) return null;

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="size-5" />
          Nivel y reputación
          <Badge className={cn("ml-auto border-transparent", meta?.color, meta?.textColor)}>
            Nivel {level} · {meta?.label}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isMax
            ? "¡Has llegado al nivel máximo! Sigue aportando a la DAO."
            : `Faltan ${pointsToNextLevel} puntos para alcanzar ${nextMeta?.label ?? `nivel ${level + 1}`}.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="m-0 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5" />
                Puntos de reputación
              </p>
              <p className="m-0 text-3xl font-bold">{points}</p>
            </div>
            {!isMax && (
              <p className="m-0 text-xs text-muted-foreground">Siguiente a los {points + pointsToNextLevel}</p>
            )}
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* How to earn */}
        <div className="space-y-2">
          <p className="m-0 text-sm font-medium">Cómo ganar puntos</p>
          <ul className="m-0 grid list-none gap-2 p-0 text-sm sm:grid-cols-2">
            {[
              { points: 50, action: "Completar una tarea" },
              { points: 10, action: "Publicar un evento" },
              { points: 5, action: "Votar en una propuesta" },
              { points: 5, action: "Apuntarte a un evento" },
            ].map(({ points, action }) => (
              <li
                key={action}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-muted-foreground"
              >
                <span>{action}</span>
                <Badge variant="secondary" className="font-mono">
                  +{points}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="m-0 flex items-center gap-1 text-sm font-medium">
              <Trophy className="size-4" />
              Tus insignias
            </p>
            {badgeCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {badgeCount.toString()} de {maxLevel}
              </span>
            )}
          </div>
          {ownedIds.length === 0 ? (
            <p className="m-0 py-4 text-center text-sm text-muted-foreground">
              Aún no tienes insignias. Las ganarás automáticamente al subir de nivel.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ownedIds.map(tokenId => (
                <BadgeTile key={tokenId.toString()} tokenId={tokenId} rewardsAddress={rewardsAddress as string} />
              ))}
            </div>
          )}
          <p className="m-0 text-xs text-muted-foreground">
            Las insignias son NFTs <strong>soulbound</strong>: nadie puede quitártelas ni transferirlas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
