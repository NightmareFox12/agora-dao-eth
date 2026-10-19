import { DaoSetup } from "../../_components/DaoSetup";
import { CreateEventForm } from "./_components/CreateEventForm";
import type { NextPage } from "next";

const NewEventPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <CreateEventForm />
    </main>
  );
};

export default NewEventPage;
