import { NetworkOptions } from "./NetworkOptions";
import { ChevronDown, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~~/components/ui/shadcn/dropdown-menu";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="destructive">
          <ChevronDown className="w-4 h-4 " />
          Wrong Network
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 font-semibold bg-popover text-popover-foreground ">
        <NetworkOptions />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="cursor-pointer text-destructive focus:text-destructive/80"
        >
          <LogOut className="w-4 h-4 text-destructive hover:text-destructive/80" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
