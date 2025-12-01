"use server";

import { CreateDaoDialog } from "./_components/CreateDaoDialog";
import { DaoGrid } from "./_components/DaoGrid";
import { HeaderDaoList } from "./_components/HeaderDaoList";
import { SearchDaos } from "./_components/SearchDaos";
import { NextPage } from "next";

const DaosPage: NextPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeaderDaoList />
      <div className="flex justify-center mt-3 gap-3 items-center md:mx-10">
        <CreateDaoDialog />
        <SearchDaos />
      </div>

      <DaoGrid />
    </main>
  );
};

export default DaosPage;
