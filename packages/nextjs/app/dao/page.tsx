import { DaoSetup } from "../_components/DaoSetup";
import { DaoDashboard } from "./_components/DaoDashboard";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <DaoDashboard />
    </main>
  );
};

export default Home;
