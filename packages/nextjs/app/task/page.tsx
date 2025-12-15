"use server";

import { DaoSetup } from "../_components/DaoSetup";
import { NextPage } from "next";

const TaskPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
    </main>
  );
};

export default TaskPage;
