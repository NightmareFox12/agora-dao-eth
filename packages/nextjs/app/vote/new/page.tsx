import { DaoSetup } from "../../_components/DaoSetup";
import { CreateProposalForm } from "./_components/CreateProposalForm";
import type { NextPage } from "next";

const NewProposalPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <CreateProposalForm />
    </main>
  );
};

export default NewProposalPage;
