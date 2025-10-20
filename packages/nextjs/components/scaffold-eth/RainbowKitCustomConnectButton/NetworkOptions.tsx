import { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import { getNetworkColor } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type NetworkOptionsProps = {
  setSelectingNetwork?: Dispatch<SetStateAction<boolean>>;
};

export const NetworkOptions = ({ setSelectingNetwork }: NetworkOptionsProps) => {
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <div className="flex flex-col">
      {setSelectingNetwork !== undefined && (
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            setSelectingNetwork(false);
          }}
        >
          <ArrowLeft />
          Back
        </Button>
      )}
      {allowedNetworks
        .filter(allowedNetwork => allowedNetwork.id !== chain?.id)
        .map(allowedNetwork => (
          <li key={allowedNetwork.id} className="list-none">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => switchChain?.({ chainId: allowedNetwork.id })}
            >
              <ArrowLeftRight />
              <span>
                Switch to{" "}
                <span
                  style={{
                    color: getNetworkColor(allowedNetwork, isDarkMode),
                  }}
                >
                  {allowedNetwork.name}
                </span>
              </span>
            </Button>
          </li>
        ))}
    </div>
  );
};
