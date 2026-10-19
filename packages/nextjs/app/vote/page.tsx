import { DaoSetup } from "../_components/DaoSetup";
import { VoteSection } from "./_components/VoteSection";
import type { NextPage } from "next";

const VotePage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <VoteSection />
    </main>
  );
};

export default VotePage;
