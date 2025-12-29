"use client";

import React from "react";
import { List } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/components/ui/shadcn/dialog";

export const RoleLastChangesDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center w-full mt-3">
          <Button className="w-[300px]">
            <List className="size-5" />
            Ver últimos cambios
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our
            servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
