"use client";

import { useEffect, useState } from "react";
import { ScaffoldFooter } from "./ScaffoldFooter";
import { ScaffoldHeader } from "./ScaffoldHeader";
import { ScaffoldSidebar } from "./ScaffoldSidebar";
import { SidebarInset, SidebarProvider } from "./ui/shadcn/sidebar";
import { Toaster } from "./ui/shadcn/sonner";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useHeaderStore } from "~~/services/store/header.store.";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  const { showHeader } = useHeaderStore();

  return (
    <SidebarProvider defaultOpen={false}>
      <Toaster richColors={true} position="top-center" />
      <ScaffoldSidebar />
      <SidebarInset>
        {showHeader && <ScaffoldHeader />}
        {children}
        <ScaffoldFooter />
      </SidebarInset>
    </SidebarProvider>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar height="3px" color="#2299dd" />
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
