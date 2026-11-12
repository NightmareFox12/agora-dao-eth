import React from "react";
import Image from "next/image";
import { HeroSection } from "./_components/HeroSection";
import { ImpactSection } from "./_components/ImpactSection";
import { ScaffoldFooter } from "~~/components/ScaffoldFooter";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";

// What each module does, in the terms the contracts enforce. Numbers here come from the contracts.
const MODULES = [
  {
    name: "Tareas",
    text: "Quien publica una tarea deposita la recompensa en ese momento. Un miembro la toma, entrega un enlace y cobra cuando el creador aprueba. Si no se ponen de acuerdo, un auditor decide.",
  },
  {
    name: "Votaciones",
    text: "Cada miembro vota una vez: a favor, en contra o abstención. Una propuesta necesita que vote al menos el 20 % de los miembros para contar.",
  },
  {
    name: "Tesorería",
    text: "Cualquiera puede donar ETH al fondo. Solo sale con una propuesta de pago aprobada, y cualquiera puede ejecutarla una vez aprobada.",
  },
  {
    name: "Eventos",
    text: "Los miembros publican encuentros con fecha, lugar y aforo, y se apuntan con su wallet. La lista de asistentes es pública.",
  },
  {
    name: "Reputación",
    text: "Completar una tarea da 50 puntos; votar o apuntarse a un evento, 5; publicar un evento, 10. Los puntos marcan tu nivel.",
  },
  {
    name: "Insignias",
    text: "Al subir de nivel recibes un NFT que nadie puede transferir ni quitarte. Es tu historial de contribución a la DAO.",
  },
];

const STEPS = [
  { title: "Conecta tu wallet", text: "No hay cuenta ni contraseña: tu wallet es tu identidad en todas las DAOs." },
  {
    title: "Entra en una DAO o crea la tuya",
    text: "Unirte es una transacción. Crear una despliega sus seis módulos de una vez.",
  },
  { title: "Toma una tarea o vota", text: "Entregas, el creador aprueba y la recompensa llega a tu wallet." },
  { title: "Sube de nivel", text: "Cada aporte suma puntos. Al cambiar de nivel recibes una insignia." },
];

const LandingPage = () => {
  return (
    <>
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="relative size-8">
              <Image src="/logo.svg" alt="" fill />
            </div>
            <span className="text-lg font-bold">Agora DAO</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#modules" className="text-muted-foreground hover:text-foreground">
              Módulos
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#impact" className="text-muted-foreground hover:text-foreground">
              Números
            </a>
          </nav>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <HeroSection />

      <section id="modules" className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="m-0 max-w-2xl text-3xl font-bold tracking-tight">
            Seis módulos, los mismos en cada DAO que se crea
          </h2>
          <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
            {MODULES.map(({ name, text }) => (
              <div key={name} className="grid gap-1 border-t py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="m-0 font-semibold">{name}</dt>
                <dd className="m-0 text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how-it-works" className="border-t">
        <div className="container mx-auto px-4 py-16">
          <h2 className="m-0 text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <ol className="m-0 mt-10 grid list-none gap-8 p-0 md:grid-cols-4">
            {STEPS.map(({ title, text }, index) => (
              <li key={title} className="space-y-2 border-t pt-4">
                <span className="text-sm tabular-nums text-muted-foreground">{index + 1}</span>
                <h3 className="m-0 text-lg font-semibold">{title}</h3>
                <p className="m-0 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ImpactSection />
      <ScaffoldFooter />
    </>
  );
};

export default LandingPage;
