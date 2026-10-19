import { DaoSetup } from "../../_components/DaoSetup";
import { EventDetail } from "./_components/EventDetail";
import type { NextPage } from "next";

const EventDetailPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <EventDetail />
    </main>
  );
};

export default EventDetailPage;
