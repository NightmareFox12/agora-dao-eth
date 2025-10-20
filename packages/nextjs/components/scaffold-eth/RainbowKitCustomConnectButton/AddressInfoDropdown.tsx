import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import { ArrowLeftRight, ChevronDown, ClipboardCheck, ExternalLink, Files, LogOut, QrCode } from "lucide-react";
import { Address, getAddress } from "viem";
import { useDisconnect } from "wagmi";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~~/components/ui/shadcn/dropdown-menu";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
  setShowQr: Dispatch<SetStateAction<boolean>>;
};

export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
  setShowQr,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();

  //states
  const [selectingNetwork, setSelectingNetwork] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [lockMenu, setLockMenu] = useState<boolean>(false);

  useEffect(() => {
    if (lockMenu) {
      setTimeout(() => {
        setLockMenu(false);
      }, 100);
    }
  }, [lockMenu]);

  return (
    <>
      <DropdownMenu onOpenChange={open => setShowMenu(lockMenu ? !open : open)} open={showMenu}>
        <DropdownMenuTrigger asChild>
          <Button onClick={() => setShowMenu(true)} className="gap-3 py-5">
            <BlockieAvatar address={checkSumAddress} size={30} ensImage={ensAvatar} />
            {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="px-2 font-semibold mr-7">
          {selectingNetwork ? (
            <NetworkOptions setSelectingNetwork={setSelectingNetwork} />
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setLockMenu(true);
                  copyAddressToClipboard(checkSumAddress);
                }}
                className="cursor-pointer"
              >
                {isAddressCopiedToClipboard ? <ClipboardCheck /> : <Files />}
                {isAddressCopiedToClipboard ? "Copied!" : "Copy Address"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowQr(true)} className="cursor-pointer">
                <QrCode /> View QR code
              </DropdownMenuItem>

              {allowedNetworks.length > 1 && (
                <DropdownMenuItem
                  onClick={() => {
                    setLockMenu(true);
                    setSelectingNetwork(true);
                  }}
                  className="cursor-pointer"
                >
                  <ArrowLeftRight />
                  Switch Network
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="flex cursor-pointer">
                <ExternalLink />
                <a href={blockExplorerAddressLink} target="_blank">
                  View on Block Explorer
                </a>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem onClick={() => disconnect()} className="!text-red-500 cursor-pointer ">
            <LogOut className="text-red-500" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
