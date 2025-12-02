"use client";

import { DropdownMenuGroup, DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Funnel, Loader } from "lucide-react";
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
import { useDaoStore } from "~~/services/store/dao.store";

export const SearchDaos: React.FC = () => {
  const { selectedFilter, setSelectedFilter } = useDaoStore();

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
            {daoCategoriesLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Funnel className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={selectedFilter === "all"} onCheckedChange={() => setSelectedFilter("all")}>
            All
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={selectedFilter === "myDaos"}
            onCheckedChange={() => setSelectedFilter("myDaos")}
          >
            My DAOs
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Categories</DropdownMenuLabel>
          <DropdownMenuGroup>
            {daoCategories?.map((category, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={selectedFilter === category}
                onCheckedChange={() => setSelectedFilter(category)}
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
