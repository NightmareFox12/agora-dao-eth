"use server";

import React from "react";
import { LucideProps, Trophy, Vote, Zap } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";

type Feature = {
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
};

const mainFeatures: Feature[] = [
  {
    title: "Transparent Voting",
    description: "Blockchain voting system that guarantees transparency and immutability in every decision.",
    icon: Vote,
  },
  {
    title: "Gamified Tasks",
    description: "Complete missions, contribute to the ecosystem, and gain experience while helping the community.",
    icon: Zap,
  },
  {
    title: "Rewards System",
    description: "Receive exclusive tokens and NFTs for your active participation in DAO governance",
    icon: Trophy,
  },
];

export const FeatureSection: React.FC = async () => {
  return (
    <section id="features" className="py-20 px-4 bg-card/30 relative z-10">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Main Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the tools that make AgoraDAO the leading platform in decentralized governance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {mainFeatures.map((x, y) => (
            <Card key={y} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <x.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{x.title}</CardTitle>
                <CardDescription>{x.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
