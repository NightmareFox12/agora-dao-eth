import React from "react";
import { DataTable } from "./dataTable";
import { UserJoinedEvent, columns } from "./userJoinedColumns";

type UserJoinedTableProps = {
  data: UserJoinedEvent[];
};

export const UserJoinedTable: React.FC<UserJoinedTableProps> = ({ data }) => {
  return (
    <div className="indent-0">
      <DataTable columns={columns} data={data} />
    </div>
  );
};
