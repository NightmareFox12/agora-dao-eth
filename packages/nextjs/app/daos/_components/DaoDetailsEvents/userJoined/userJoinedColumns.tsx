import { ColumnDef } from "@tanstack/react-table";

export type UserJoinedEvent = {
  address: string;
  args: { user: string; userID: bigint };
  blockData: { timestamp: bigint };
  blockHash: string;
  eventName: "UserJoined";
  transactionHash: string;
};

//TODO: averiguar como editar los campos para formtear la fecha y el link del hashTransaction

export const columns: ColumnDef<UserJoinedEvent>[] = [
  {
    accessorKey: "address",
    header: "User",
  },
  {
    accessorKey: "transactionHash",
    header: "Hash",
  },
  {
    accessorKey: "blockData.timestamp",
    header: "Date",
  },
];
