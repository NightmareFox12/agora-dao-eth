import { DaoSetup } from "../../_components/DaoSetup";
import { ProposalDetail } from "./_components/ProposalDetail";
import type { NextPage } from "next";

const ProposalDetailPage: NextPage = () => {
  return (
    <main>
      <DaoSetup />
      <ProposalDetail />
    </main>
  );
};

export default ProposalDetailPage;
