import { DaoSetup } from "../_components/DaoSetup";
import { EventsSection } from "./_components/EventsSection";
import type { NextPage } from "next";

const EventsPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <EventsSection />
    </main>
  );
};

export default EventsPage;
