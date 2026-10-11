import { DaoSetup } from "../../_components/DaoSetup";
import { TaskDetail } from "./_components/TaskDetail";
import type { NextPage } from "next";

const TaskDetailPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <TaskDetail />
    </main>
  );
};

export default TaskDetailPage;
