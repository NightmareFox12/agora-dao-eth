"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaucetButton } from "./scaffold-eth/FaucetButton";
import { RainbowKitCustomConnectButton } from "./scaffold-eth/RainbowKitCustomConnectButton";
import { Button } from "./ui/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/shadcn/dropdown-menu";
import { useSidebar } from "./ui/shadcn/sidebar";
import {
  Bolt,
  BugIcon,
  CalendarDays,
  DoorOpenIcon,
  Files,
  Home,
  Landmark,
  Menu,
  MoreHorizontal,
  UserRound,
  Vote,
} from "lucide-react";
import { hardhat } from "viem/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useCurrentDao } from "~~/hooks/useCurrentDao";
import { cn } from "~~/lib/utils";
import { useHeaderStore } from "~~/services/store/header.store";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Lets the guided tour point at this link (data-tour attribute). */
  tour?: string;
};

// Primary links: the ones a member uses day to day. They sit in the top nav.
const PRIMARY_LINKS: HeaderMenuLink[] = [
  { label: "Inicio", href: "/dao", icon: <Home className="h-4 w-4" /> },
  { label: "Tareas", href: "/task", icon: <Files className="h-4 w-4" />, tour: "nav-tareas" },
  { label: "Votaciones", href: "/vote", icon: <Vote className="h-4 w-4" />, tour: "nav-votaciones" },
  { label: "Eventos", href: "/events", icon: <CalendarDays className="h-4 w-4" />, tour: "nav-eventos" },
  { label: "Tesorería", href: "/treasury", icon: <Landmark className="h-4 w-4" />, tour: "nav-tesoreria" },
  { label: "Perfil", href: "/profile", icon: <UserRound className="h-4 w-4" />, tour: "nav-perfil" },
];

// Secondary links: shown inside a "More" dropdown so the top nav stays short.
const SECONDARY_LINKS: HeaderMenuLink[] = [
  { label: "Configuración", href: "/configuration", icon: <Bolt className="h-4 w-4" />, tour: "nav-configuracion" },
  { label: "Debug", href: "/debug", icon: <BugIcon className="h-4 w-4" /> },
  { label: "Cerrar sesión", href: "/logout", icon: <DoorOpenIcon className="h-4 w-4" /> },
];

/** Every link, for the mobile sidebar that lists them all. */
export const menuLinks: HeaderMenuLink[] = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

export const ScaffoldHeader = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { showHeader } = useHeaderStore();
  const { dao } = useCurrentDao();

  if (!showHeader) return null;

  const isSecondaryActive = SECONDARY_LINKS.some(link => link.href === pathname);

  return (
    <header className="w-full border-b">
      <div className="mx-4 flex h-16 items-center justify-between gap-2">
        <Link href="/" passHref className="hidden shrink-0 items-center gap-2 md:flex">
          <div className="relative flex h-10 w-10">
            <Image src="/logo.svg" alt="SE2 logo" className="cursor-pointer" fill />
          </div>
          <div className="flex min-w-0 max-w-48 flex-col">
            <span className="font-bold leading-tight">Agora DAO</span>
            <span className="truncate text-xs">{dao?.name ?? "Gobierno descentralizado"}</span>
          </div>
        </Link>

        {/* Desktop nav: primary links + "More" dropdown */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
          {PRIMARY_LINKS.map(({ label, href, icon, tour }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} data-tour={tour}>
                <Button
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={cn(!isActive && "border-[0.5px]", "px-2.5 lg:px-3")}
                >
                  {icon}
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant={isSecondaryActive ? "default" : "ghost"}
                className={cn(!isSecondaryActive && "border-[0.5px]", "px-2.5 lg:px-3")}
                aria-label="Más opciones"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden lg:inline">Más</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SECONDARY_LINKS.map(({ label, href, icon, tour }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} data-tour={tour}>
                    {icon}
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile: sidebar toggle */}
        <nav className="flex flex-1 md:hidden">
          <Button onClick={toggleSidebar} variant="default" size="icon">
            <Menu className="w-4 h-4" />
          </Button>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>
    </header>
  );
};
