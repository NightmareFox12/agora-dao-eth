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
    id: "index",
    header: "",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "address",
    header: "User",
  },
  {
    accessorKey: "blockData.timestamp",
    header: "Date",
    cell: ({ row }) =>
      new Date(parseInt((row.original.blockData.timestamp * 1000n).toString())).toISOString().split("T")[0],
  },
];
