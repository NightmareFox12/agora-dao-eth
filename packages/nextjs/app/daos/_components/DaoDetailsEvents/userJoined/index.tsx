import React from "react";
import { JoinedTable } from "./JoinedTable";
import { UserJoinedEvent, columns } from "./userJoinedColumns";

type UserJoinedTableProps = {
  data: UserJoinedEvent[];
};

export const UserJoinedTable: React.FC<UserJoinedTableProps> = ({ data }) => {
  return (
    <div className="indent-0">
      <JoinedTable columns={columns} data={data} />
    </div>
  );
};
