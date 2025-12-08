"use server";

import { RoleConfig } from "./_components/RoleConfig";
import { NextPage } from "next";

const ConfigurationPage: NextPage = () => {
  return (
    <main>
      <RoleConfig />
    </main>
  );
};

export default ConfigurationPage;
