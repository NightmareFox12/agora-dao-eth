import { DaoSetup } from "../_components/DaoSetup";
import { TreasurySection } from "./_components/TreasurySection";
import type { NextPage } from "next";

const TreasuryPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <TreasurySection />
    </main>
  );
};

export default TreasuryPage;
