"use server";

import { CreateDaoDialog } from "./_components/CreateDaoDialog";
import { DaoGrid } from "./_components/DaoGrid";
import { HeaderDaoList } from "./_components/HeaderDaoList";
import { NextPage } from "next";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

// const daos = [
//   {
//     id: 1,
//     name: "DeFi Protocol DAO",
//     description:
//       "Una organización descentralizada enfocada en el desarrollo de protocolos DeFi innovadores y sostenibles.",
//     category: "DeFi",
//     members: 1250,
//     icon: Coins,
//   },
//   {
//     id: 2,
//     name: "GameFi Collective",
//     description: "Comunidad de desarrolladores y jugadores creando el futuro de los juegos blockchain.",
//     category: "Gaming",
//     members: 890,
//     icon: Gamepad2,
//   },
//   {
//     id: 3,
//     name: "Social Impact DAO",
//     description: "Financiando proyectos que generan impacto social positivo a través de tecnología blockchain.",
//     category: "Social Impact",
//     members: 2100,
//     icon: Heart,
//   },
//   {
//     id: 4,
//     name: "Infrastructure DAO",
//     description: "Construyendo la infraestructura del futuro descentralizado con herramientas y servicios esenciales.",
//     category: "Infrastructure",
//     members: 567,
//     icon: Building,
//   },
//   {
//     id: 5,
//     name: "Energy DAO",
//     description: "Revolucionando el sector energético con soluciones descentralizadas y sostenibles.",
//     category: "Energy",
//     members: 743,
//     icon: Zap,
//   },
//   {
//     id: 6,
//     name: "Creator Economy DAO",
//     description: "Empoderando a creadores de contenido con herramientas y financiación descentralizada.",
//     category: "Creator Economy",
//     members: 1456,
//     icon: Users,
//   },
// ];

// const daos: any = [];

const DaosPage: NextPage = async () => {
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
