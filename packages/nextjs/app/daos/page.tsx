"use server";

import { CreateDaoDialog } from "./_components/CreateDaoDialog";
import { DaoGrid } from "./_components/DaoGrid";
import { HeaderDaoList } from "./_components/HeaderDaoList";
import { NextPage } from "next";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const DaosPage: NextPage = () => {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <HeaderDaoList />
      {/* Create Dao Dialog */}
      <div className="flex justify-center mt-3">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
      <CreateDaoDialog />
      {/* Dao grid */}
      <DaoGrid />
    </main>
  );
};

export default DaosPage;
