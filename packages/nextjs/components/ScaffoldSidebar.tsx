import React from "react";
import Image from "next/image";
import Link from "next/link";
import { menuLinks } from "./ScaffoldHeader";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/shadcn/sidebar";

export const ScaffoldSidebar: React.FC = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <article className="flex items-center gap-2 mr-6 shrink-0">
          <div className="flex relative w-7 h-7">
            <Image src="/logo.svg" alt="SE2 logo" fill />
          </div>
          <div className="flex flex-col -space-y-1 mb-0.5">
            <span className="font-semibold ">Scaffold-ETH</span>
            <span className="text-xs">Ethereum dev stack</span>
          </div>
        </article>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-1">
          {menuLinks.map(({ href, label, icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild>
                <Link href={href}>
                  {icon}
                  {label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
