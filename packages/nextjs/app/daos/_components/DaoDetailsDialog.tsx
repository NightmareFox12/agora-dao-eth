import { useMemo } from "react";
import { UserJoinedTable } from "./DaoDetailsEvents/userJoined";
import { UserJoinedEvent } from "./DaoDetailsEvents/userJoined/userJoinedColumns";
import { CalendarDays, Crown, FileCode2, Image as ImageIcon, Info, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
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
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { getCategoryStyle } from "~~/lib/categoryColors";

type DaoDetailsDialogProps = {
  daoID: bigint;
  daoAddress: string;
  name: string;
  description: string;
  imageUri: string;
  creationDate: bigint;
  creator: string;
  categories: { id: number; name: string }[];
};

export const DaoDetailsDialog: React.FC<DaoDetailsDialogProps> = ({
  daoID,
  daoAddress,
  name,
  description,
  imageUri,
  creationDate,
  creator,
  categories,
}) => {
  const { address: userAddress } = useAccount();

  //const
  const parsedDate = new Date(Number(creationDate) * 1000).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isCreator = userAddress !== undefined && userAddress.toLowerCase() === creator.toLowerCase();

  //Smart contract
  const { data: userCounter, isLoading: userCounterLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "userCounter",
    contractAddress: daoAddress,
  });

  const { data: userJoined, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "UserJoined",
    contractAddress: daoAddress,
    fromBlock: 0n,
    watch: true,
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

  const infoItems = [
    {
      icon: Crown,
      label: "Creador",
      value: <Address address={creator} />,
      badge: isCreator ? (
        <Badge className="border-transparent bg-emerald-600 normal-case tracking-normal text-white dark:bg-emerald-500 dark:text-emerald-950">
          Eres tú
        </Badge>
      ) : undefined,
    },
    {
      icon: CalendarDays,
      label: "Fecha de creación",
      value: <span className="text-sm font-medium">{parsedDate}</span>,
    },
    {
      icon: Users,
      label: "Miembros",
      value:
        userCounter === undefined || userCounterLoading ? (
          <Skeleton className="h-5 w-10" />
        ) : (
          <span className="text-sm font-medium">{userCounter.toString()}</span>
        ),
    },
    {
      icon: FileCode2,
      label: "Contrato de la DAO",
      value: <Address address={daoAddress} />,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-primary/10 flex items-center justify-center">
              {imageUri.length > 4 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://ipfs.io/ipfs/${imageUri}`} alt={name} className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2 pr-6">
                <DialogTitle className="text-2xl break-words">{name}</DialogTitle>
                <Badge variant="secondary">#{daoID.toString()}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(category => (
                  <Badge key={category.id} variant="outline" className={getCategoryStyle(category.id).soft}>
                    {category.name.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogDescription className="pt-2 break-words text-foreground/80">{description}</DialogDescription>
        </DialogHeader>

        {/* Info */}
        <dl className="grid gap-3 sm:grid-cols-2">
          {infoItems.map(({ icon: Icon, label, value, badge }) => (
            <div key={label} className="min-w-0 rounded-lg border bg-card p-3 space-y-1.5">
              <dt className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {label}
                </span>
                {badge}
              </dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Events */}
        {isLoadingEvents ? (
          <Skeleton className="h-24" />
        ) : (
          <Tabs defaultValue="users-joined" className="w-full">
            <TabsList className="w-full flex justify-center items-center">
              <TabsTrigger className="flex-1" value="users-joined">
                Usuarios Unidos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users-joined">
              <ScrollArea className="w-full">
                <UserJoinedTable data={userJoinedArr.slice(0, 4)} />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
