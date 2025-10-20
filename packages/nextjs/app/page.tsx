"use server";

import React, { Suspense } from "react";
import { FeatureSection } from "./_components/FeatureSection";
import { HeroSection } from "./_components/HeroSection";
import { ImpactSection } from "./_components/ImpactSection";
import { ParticlesBackground } from "./_components/ParticlesBackground";
import { Vote } from "lucide-react";
import { ScaffoldFooter } from "~~/components/ScaffoldFooter";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";

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
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it works
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
        <Suspense
          fallback={
            <section className="w-full">
              <div className="container grid md:grid-cols-3 gap-8 mx-auto">
                <Skeleton className="w-full h-52" />
                <Skeleton className="w-full h-52" />
                <Skeleton className="w-full h-52" />
              </div>
            </section>
          }
        >
          <FeatureSection />
        </Suspense>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 relative z-10">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to begin your journey in AgoraDAO
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Connect your Wallet</h3>
                <p className="text-muted-foreground">Connect your Web3 wallet and create or join a DAO.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent-foreground">2</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Participate and vote</h3>
                <p className="text-muted-foreground">
                  Vote on important proposals and complete tasks to gain experience.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">3</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Recibe Recompensas</h3>
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
        {/* <footer className="border-t bg-card/30 py-12 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Vote className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">AgoraDAO</span>
              </div>
              <p className="text-muted-foreground">
                La plataforma líder en gobernanza descentralizada y participación comunitaria.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Roadmap
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Tokenomics
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Comunidad</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Telegram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Recursos</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentación
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Soporte
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 AgoraDAO. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer> */}
      </section>
      <ScaffoldFooter />
    </>
  );
};

export default LandingPage;
