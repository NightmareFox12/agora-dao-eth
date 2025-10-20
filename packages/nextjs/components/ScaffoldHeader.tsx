"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaucetButton } from "./scaffold-eth/FaucetButton";
import { RainbowKitCustomConnectButton } from "./scaffold-eth/RainbowKitCustomConnectButton";
import { Button } from "./ui/shadcn/button";
import { useSidebar } from "./ui/shadcn/sidebar";
import { BugIcon, Home, Menu } from "lucide-react";
import { hardhat } from "viem/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useHeaderStore } from "~~/services/store/header.store.";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugIcon className="h-4 w-4" />,
  },
];

export const ScaffoldHeader = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { showHeader } = useHeaderStore();

  if (!showHeader) return null;

  return (
    <header className="w-full border-b">
      <div className="mx-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 justify-center">
          <Link href="/" passHref className="hidden md:flex items-center gap-2 ml-4 mr-6 shrink-0">
            <div className="flex relative w-10 h-10">
              <Image src="/logo.svg" alt="SE2 logo" className="cursor-pointer" fill />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight">Scaffold-ETH</span>
              <span className="text-xs">Ethereum dev stack</span>
            </div>
          </Link>
        </div>
        <nav className="hidden md:flex space-x-4 flex-1">
          {menuLinks.map(({ label, href, icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}>
                <Button variant={isActive ? "default" : "ghost"} className={!isActive ? "border-[0.5px]" : ""}>
                  {icon}
                  <span>{label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
        <nav className="flex flex-1 md:hidden">
          <Button onClick={toggleSidebar} variant="default" size="icon">
            <Menu className="w-4 h-4" />
          </Button>
        </nav>
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </header>
  );
};
