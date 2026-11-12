import React, { Suspense } from "react";
import { HeroSection } from "./_components/HeroSection";
import { ImpactSection } from "./_components/ImpactSection";
import { ParticlesBackground } from "./_components/ParticlesBackground";
import { LucideIcon, Trophy, Vote, Zap } from "lucide-react";
import { ScaffoldFooter } from "~~/components/ScaffoldFooter";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";
import { Card, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const mainFeatures: Feature[] = [
  {
    title: "Voto Transparente",
    description:
      "Sistema de votación en cadena de bloques que garantiza transparencia e inmutabilidad en cada decisión.",
    icon: Vote,
  },
  {
    title: "Tareas Gamificadas",
    description: "Completar misiones, contribuir al ecosistema y ganar experiencia mientras ayudas a la comunidad.",
    icon: Zap,
  },
  {
    title: "Sistema de recompensas",
    description: "Recibe tokens y NFTs exclusivos por tu participación activa en la gobernanza del DAO.",
    icon: Trophy,
  },
];

const REPO = "https://github.com/NightmareFox12/agora-dao-eth";

// GitHub's own mark (lucide dropped brand icons)
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
  </svg>
);

// Only links that lead somewhere today
const FOOTER_LINKS = [
  {
    title: "Producto",
    links: [
      { label: "Características", href: "#features" },
      { label: "Cómo funciona", href: "#how-it-works" },
      { label: "Impacto", href: "#impact" },
    ],
  },
  {
    title: "Módulos",
    links: [
      { label: "Tareas", href: `${REPO}/blob/main/docs/modules/tasks.md`, external: true },
      { label: "Votaciones", href: `${REPO}/blob/main/docs/modules/votes.md`, external: true },
      { label: "Tesorería", href: `${REPO}/blob/main/docs/modules/treasury.md`, external: true },
      { label: "Eventos", href: `${REPO}/blob/main/docs/modules/events.md`, external: true },
      { label: "Reputación y recompensas", href: `${REPO}/blob/main/docs/modules/reputation.md`, external: true },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Código en GitHub", href: REPO, external: true },
      { label: "Hoja de ruta", href: `${REPO}/blob/main/ROADMAP.md`, external: true },
      { label: "Explorador de bloques", href: "/blockexplorer" },
    ],
  },
];
const LandingPage = () => {
  return (
    <>
      <section className="min-h-screen bg-background relative scroll-smooth">
        {/* Particles Background  */}
        <Suspense>
          <ParticlesBackground />
        </Suspense>

        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm top-0 z-50 relative">
          <div className="mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="hidden sm:block text-xl font-bold text-foreground">AgoraDAO</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Características
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                Cómo funciona
              </a>
              <a href="#impact" className="text-muted-foreground hover:text-foreground transition-colors">
                Impacto
              </a>
              {/* <a href="#rewards" className="text-muted-foreground hover:text-foreground transition-colors">
                Recompensas
              </a> */}
            </nav>
            <div className="flex gap-1">
              <RainbowKitCustomConnectButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-card/30 relative z-10">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Características Principales</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descubre las herramientas que hacen de AgoraDAO la plataforma líder en gobernanza descentralizada.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {mainFeatures.map(({ title, description, icon: Icon }) => (
                <Card key={title} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 relative z-10">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Cómo funciona</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tres pasos simples para comenzar tu viaje en AgoraDAO
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Conecta tu wallet</h3>
                <p className="text-muted-foreground">Conecta tu wallet y crea o une a un DAO.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent-foreground">2</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Participa y vota</h3>
                <p className="text-muted-foreground">
                  Vota en propuestas importantes y completa tareas para ganar experiencia.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">3</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Recibe recompensas</h3>
                <p className="text-muted-foreground">
                  Gana tokens, NFTs y beneficios exclusivos por tu participación activa
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <Suspense fallback={<Skeleton className="w-full h-60" />}>
          <ImpactSection />
        </Suspense>

        {/* Rewards Section */}
        {/* <section id="rewards" className="py-20 px-4 bg-card/30 relative z-10">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Sistema de Recompensas Innovador
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  En AgoraDAO, cada acción cuenta. Nuestro sistema de recompensas reconoce y premia la participación
                  activa de la comunidad.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Tokens de gobernanza por votar</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-foreground">NFTs exclusivos por completar tareas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Acceso temprano a nuevas funciones</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Beneficios especiales en el ecosistema</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-primary">
                      <CountUp from={0} to={850} separator="," direction="up" duration={1} className="count-up-text" />+
                    </CardTitle>
                    <CardDescription>Recompensas Distribuidas</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-2xl ">
                      <CountUp from={0} to={850} separator="," direction="up" duration={1} className="count-up-text" />+
                    </CardTitle>
                    <CardDescription>Miembros Activos</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Vote className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-primary">320+</CardTitle>
                    <CardDescription>Propuestas Votadas</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-2xl">
                      {" "}
                      <CountUp from={0} to={100} separator="," direction="up" duration={1} className="count-up-text" />%
                    </CardTitle>
                    <CardDescription>Transparencia</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        {/* <section className="py-20 px-4 relative z-10">
          <div className="container mx-auto text-center">
            <Card className="max-w-4xl mx-auto bg-card border-border">
              <CardHeader className="py-12">
                <CardTitle className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  ¿Listo para Ser Parte del Futuro?
                </CardTitle>
                <CardDescription className="text-lg mb-8 max-w-2xl mx-auto">
                  Únete a AgoraDAO hoy y comienza a participar en la gobernanza descentralizada. Tu voz importa, tus
                  acciones cuentan.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Conectar Wallet
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 bg-transparent"
                  >
                    Explorar Documentación
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section> */}

        {/* Footer */}
        <footer className="border-t bg-card/30 py-12 px-4 relative z-10">
          <div className="container mx-auto">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Vote className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">AgoraDAO</span>
                </div>
                <p className="m-0 text-muted-foreground">
                  Tareas con recompensa, votaciones y un fondo común para tu comunidad, con las reglas en la blockchain.
                </p>
              </div>

              {FOOTER_LINKS.map(({ title, links }) => (
                <div key={title}>
                  <h4 className="m-0 mb-4 font-semibold text-foreground">{title}</h4>
                  <ul className="m-0 list-none space-y-2 p-0 text-muted-foreground">
                    {links.map(({ label, href, external }) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="hover:text-foreground transition-colors"
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-8 pt-8 flex flex-col items-center justify-between gap-4 text-muted-foreground sm:flex-row">
              <p className="m-0">© {new Date().getFullYear()} AgoraDAO</p>
              <a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver el código en GitHub"
                className="transition-colors hover:text-foreground"
              >
                <GitHubIcon className="size-6" />
              </a>
            </div>
          </div>
        </footer>
      </section>
      <ScaffoldFooter />
    </>
  );
};

export default LandingPage;
