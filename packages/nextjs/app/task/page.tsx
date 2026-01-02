"use server";

import { DaoSetup } from "../_components/DaoSetup";
import { TaskSection } from "./_components/TaskSection";
import { NextPage } from "next";

const TaskPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <TaskSection />
    </main>
  );
};

export default TaskPage;
