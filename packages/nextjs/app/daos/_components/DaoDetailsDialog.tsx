import { useMemo } from "react";
import { UserJoinedTable } from "./DaoDetailsEvents/userJoined";
import { UserJoinedEvent } from "./DaoDetailsEvents/userJoined/userJoinedColumns";
import { Image, Info } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/components/ui/shadcn/dialog";
import { ScrollArea, ScrollBar } from "~~/components/ui/shadcn/scroll-area";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";

type DaoDetailsDialogProps = {
  daoID: bigint;
  daoAddress: string;
  name: string;
  description: string;
  imageUri: string;
  creationDate: bigint;
};

export const DaoDetailsDialog: React.FC<DaoDetailsDialogProps> = ({
  daoID,
  daoAddress,
  name,
  description,
  imageUri,
  creationDate,
}) => {
  //const
  const parsedDate = new Date(parseInt((creationDate * 1000n).toString())).toISOString().split("T")[0];

  //Smart contract
  const {
    data: userJoined,
    isLoading: isLoadingEvents,
    // error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "UserJoined",
    contractAddress: daoAddress,
    fromBlock: 0n,
    watch: true,
    // filters: { greetingSetter: "0x9eB2C4866aAe575bC88d00DE5061d5063a1bb3aF" },
    blockData: true,
    transactionData: true,
    receiptData: true,
  });

  //TODO: agregar tabla de eventos con un tab para (unidos,votaciones o mas cosas)

  //memos
  const userJoinedArr = useMemo(() => {
    if (!userJoined || userJoined.length === 0 || isLoadingEvents) return [];

    const data: UserJoinedEvent[] = [];
    userJoined.map(x => data.push(x as unknown as UserJoinedEvent));

    return data;
  }, [isLoadingEvents, userJoined]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="sm:max-w-md">
          <DialogTitle>{name} Details</DialogTitle>
          <DialogDescription className="break-all overflow-ellipsis">{description}</DialogDescription>
        </DialogHeader>

        <div className="sm:max-w-md flex justify-between">
          <span className="text-sm text-muted-foreground">Created on: {parsedDate}</span>
          <Badge>ID #{daoID}</Badge>
        </div>

        <div className="sm:max-w-md flex flex-col justify-center items-center">
          {imageUri.length > 4 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://ipfs.io/ipfs/${imageUri}`} alt={name} className="object-cover w-32 h-32" />
          ) : (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image className="w-12 h-12" />
          )}
          <span className="text-sm text-muted-foreground">Logo</span>
        </div>

        {isLoadingEvents ? (
          <Skeleton className="sm:max-w-md h-24" />
        ) : (
          <div className="sm:max-w-md flex justify-center items-center flex-col">
            <Tabs defaultValue="users-joined" className="w-full">
              <TabsList className="w-full flex justify-center items-center">
                <TabsTrigger className="flex-1" value="users-joined">
                  User Joined
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="password">
                  Password
                </TabsTrigger>
              </TabsList>
              <TabsContent value="users-joined">
                <ScrollArea className="w-[300px] sm:w-full">
                  <UserJoinedTable data={userJoinedArr.slice(0, 4)} />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="password">Change your password here.</TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
