import { DaoSetup } from "../../_components/DaoSetup";
import { CreateTaskForm } from "./_components/CreateTaskForm";
import type { NextPage } from "next";

const NewTaskPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <CreateTaskForm />
    </main>
  );
};

export default NewTaskPage;
