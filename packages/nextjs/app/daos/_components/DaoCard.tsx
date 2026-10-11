"use client";

import React from "react";
import dynamic from "next/dynamic";
import { DaoDetailsDialog } from "./DaoDetailsDialog";
import { DoorOpen, Image, Loader2, Users } from "lucide-react";
import { useRouter } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { DEFAULT_ADMIN_ROLE, USER_ROLE } from "~~/constants/roles";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { getLogoUrl } from "~~/lib/storage";
import { cn } from "~~/lib/utils";

//dinamycs
const NoSSRBadge = dynamic(() => import("~~/components/ui/shadcn/badge").then(module => module.Badge), { ssr: false });

//constans
const BORDER_COLOR = {
  dark: "border-blue-400",
  light: "border-blue-500",
} as const;

type DaoCardProps = {
  daoID: bigint;
  daoAddress: string;
  userAddress: string | undefined;
  creator: string;
  name: string;
  description: string;
  categories: { id: number; name: string }[];
  imageUri: string;
  creationDate: bigint;
};

export const DaoCard: React.FC<DaoCardProps> = ({
  daoID,
  daoAddress,
  userAddress,
  creator,
  name,
  description,
  categories,
  imageUri,
  creationDate,
}) => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  //consts
  const isDarkMode = (resolvedTheme ?? "light") === "dark";

  //smart contract
  const { writeContractAsync: writeAgoraDaoAsync } = useScaffoldWriteContract({
    contractName: "AgoraDao",
    contractAddress: daoAddress,
  });

  const { data: userCounter, isLoading: userCounterLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "userCounter",
    contractAddress: daoAddress,
  });

  const { data: isOwner, isLoading: isOwnerLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    args: [DEFAULT_ADMIN_ROLE, userAddress],
    contractAddress: daoAddress,
  });

  const { data: isMember, isLoading: isMemberLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    args: [USER_ROLE, userAddress],
    contractAddress: daoAddress,
  });

  //functions
  const handleJoinDao = async () => {
    try {
      if (!userAddress) return;

      if (isOwner || isMember) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS, daoAddress);
        router.push(`/dao?address=${daoAddress}`);
        return;
      }
      await writeAgoraDaoAsync({
        functionName: "joinDao",
      });
      localStorage.setItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS, daoAddress);
      router.push(`/dao?address=${daoAddress}`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col transition-all hover:shadow-lg",
        isOwner ? BORDER_COLOR[isDarkMode ? "dark" : "light"] : "",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              {imageUri.length > 4 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getLogoUrl(imageUri)} alt={name} className="object-cover" />
              ) : (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image className="w-6 h-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {userCounter === undefined || userCounterLoading ? (
                  <Skeleton className="h-5 w-5 bg-primary/50" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {userCounter} {userCounter === 1n ? "usuario" : "usuarios"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <NoSSRBadge>#{daoID}</NoSSRBadge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(({ id, name }) => (
            <NoSSRBadge key={id} variant="outline" className={getCategoryStyle(id).soft}>
              {name.toLowerCase()}
            </NoSSRBadge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="text-sm leading-relaxed break-all">
          {description.length > 100 ? description.slice(0, 100) + "..." : description}
        </CardDescription>
      </CardContent>

      <CardFooter>
        <div className="w-full flex items-center justify-between gap-1 md:gap-1.5">
          <Button
            onClick={handleJoinDao}
            className={`flex-1 ${isOwner ? "bg-secondary-foreground" : "bg-primary"}`}
            size="sm"
            disabled={isOwnerLoading || isMemberLoading}
          >
            {isOwnerLoading || isMemberLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : isOwner || isMember ? (
              <>
                <DoorOpen className="h-4 w-4" />
                Entrar
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Unirse
              </>
            )}
          </Button>
          <DaoDetailsDialog
            daoID={daoID}
            daoAddress={daoAddress}
            name={name}
            description={description}
            imageUri={imageUri}
            creationDate={creationDate}
            creator={creator}
            categories={categories}
          />
        </div>
      </CardFooter>
    </Card>
  );
};
