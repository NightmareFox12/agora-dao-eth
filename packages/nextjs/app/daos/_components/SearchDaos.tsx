"use client";

import { Funnel } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";

export const SearchDaos: React.FC = () => {
  return (
    <>
      <Input className="w-full md:w-1/4" placeholder="Search DAOs..." />
      <Button size="icon">
        <Funnel className="h-4 w-4" />
      </Button>
    </>
  );
};
