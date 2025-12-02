"use client";

import { useState } from "react";
import { DropdownMenuGroup, DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Funnel } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~~/components/ui/shadcn/dropdown-menu";
import { Input } from "~~/components/ui/shadcn/input";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

export const SearchDaos: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useState<string | null>(null);

  //smart contract
  const { data: daoCategories, isLoading: daoCategoriesLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaoCategories",
  });

  return (
    <>
      <Input className="w-full md:w-1/4" placeholder="Search DAOs..." />
      <DropdownMenu>
        {/* Button trigger */}
        <DropdownMenuTrigger asChild>
          <Button size="icon" disabled={daoCategoriesLoading}>
            <Funnel className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={selectedFilters === "myDaos"}
            onCheckedChange={() => setSelectedFilters("myDaos")}
          >
            My DAOs
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Categories</DropdownMenuLabel>
          <DropdownMenuGroup>
            {daoCategories?.map((category, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={selectedFilters === category}
                onCheckedChange={() => setSelectedFilters(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
