"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";
import DecryptedText from "~~/components/ui/DecryptedText";
import RotatingText from "~~/components/ui/RotatingText";
import { Badge } from "~~/components/ui/shadcn/badge";

export const HeroSection: React.FC = () => {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push("/daos");
  }, [isConnected, router]);

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="container mx-auto text-center max-w-4xl">
        <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 ">
          <Rocket />
          <DecryptedText
            text="Decentralization in Action"
            animateOn="view"
            speed={100}
            maxIterations={15}
            revealDirection="center"
          />
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
          <div className="flex justify-center">The platform for DAOs that work seriously</div>
        </h1>
        <RotatingText
          texts={["Vote", "Participate", "Earn", "Organize", "Clear tasks", "Collective decisions"]}
          mainClassName="text-4xl md:text-6xl font-bold text-foreground px-2 sm:px-2 md:px-3 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
          staggerFrom={"last"}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
          elementLevelClassName="text-blue-500"
          transition={{ type: "keyframes", damping: 30, stiffness: 400 }}
          rotationInterval={2000}
        />
        <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
          AgoraDAO is the decentralized platform where your voice matters. Participate in important decisions, complete
          tasks, and receive rewards for contributing to the ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    </section>
  );
};
