"use client";

import React from "react";
import { Shield, TrendingUp, Trophy, Users, Vote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import CountUp from "~~/components/ui/CountUp";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "~~/components/ui/shadcn/chart";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const ImpactSection: React.FC = () => {
  //smart contract
  const { data: daoCounter, isLoading: daoCounterLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFabric",
    functionName: "getTotalDaoCount",
  });

  const { data: userCounter, isLoading: userCounterLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFabric",
    functionName: "userCounter",
  });

  //components
  const NumbersTab = () => {
    return (
      <TabsContent value="numbers">
        <div className="grid grid-cols-2 gap-4">
          {/* DAOs created */}
          {daoCounterLoading ? (
            <Skeleton className="h-44 rounded-lg bg-primary/20" />
          ) : (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">
                  <CountUp
                    from={0}
                    to={parseInt(daoCounter?.toString() ?? "0") === 0 ? 0 : parseInt(daoCounter?.toString() ?? "0") - 1}
                    separator=","
                    direction="up"
                    duration={1}
                    className="count-up-text"
                  />
                  +
                </CardTitle>
                <CardDescription>DAOs created</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Users Registered */}
          {userCounterLoading ? (
            <Skeleton className="h-44 rounded-lg bg-primary/20" />
          ) : (
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  <CountUp
                    from={0}
                    to={
                      parseInt(userCounter?.toString() ?? "0") === 0 ? 0 : parseInt(userCounter?.toString() ?? "0") - 1
                    }
                    separator=","
                    direction="up"
                    duration={1}
                    className="count-up-text"
                  />
                  +
                </CardTitle>
                <CardDescription>Registered Users</CardDescription>
              </CardHeader>
            </Card>
          )}

          {daoCounterLoading && userCounterLoading ? (
            <Skeleton className="h-44 rounded-lg bg-primary/20" />
          ) : (
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  <CountUp from={0} to={100} separator="," direction="up" duration={1} className="count-up-text" />%
                </CardTitle>
                <CardDescription>Transparencia</CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Vote className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">320+</CardTitle>
              <CardDescription>Propuestas Votadas</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </TabsContent>
    );
  };

  const ChartsTab = () => {
    const chartData = [
      { month: "January", desktop: 186 },
      { month: "February", desktop: 305 },
      { month: "March", desktop: 237 },
      { month: "April", desktop: 73 },
      { month: "May", desktop: 209 },
      { month: "June", desktop: 214 },
    ];

    const chartConfig = {
      desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
      },
    } satisfies ChartConfig;

    return (
      <TabsContent value="charts">
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={value => value.slice(0, 3)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</div>
          </CardFooter>
        </Card>
      </TabsContent>
    );
  };

  return (
    <section id="impact" className="py-20 px-4 bg-card/30 relative z-10">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-center md:text-left text-3xl md:text-4xl font-bold text-foreground mb-6">Our Impact</h2>
            <p className="text-center md:text-left text-lg text-muted-foreground mb-8">
              At AgoraDAO, every action counts. Our rewards system recognizes and rewards active community
              participation.
            </p>

            {/* <div className="space-y-4">
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
            </div> */}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="numbers">
            <TabsList className="w-full flex justify-center">
              <TabsTrigger value="numbers">Numbers</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <NumbersTab />
            <ChartsTab />
          </Tabs>
        </div>
      </div>
    </section>
  );
};

{
  /* <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-primary">
                      <CountUp from={0} to={850} separator="," direction="up" duration={1} className="count-up-text" />+
                    </CardTitle>
                    <CardDescription>Recompensas Distribuidas</CardDescription>
                  </CardHeader>
                </Card> */
}
