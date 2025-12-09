"use server";

import { DaoSetup } from "../_components/DaoSetup";
import { RoleConfig } from "./_components/RoleConfig";
import { NextPage } from "next";

const ConfigurationPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <RoleConfig />
    </main>
  );
};

export default ConfigurationPage;
