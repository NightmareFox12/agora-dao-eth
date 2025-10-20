"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/shadcn/dialog";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Address as AddressType, createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { Address, AddressInput, Balance, EtherInput } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";

// Account index to use from generated hardhat accounts.
const FAUCET_ACCOUNT_INDEX = 0;

const localWalletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * Faucet modal which lets you send ETH to any address.
 */
export const Faucet = () => {
  const [loading, setLoading] = useState(false);
  const [inputAddress, setInputAddress] = useState<AddressType>();
  const [faucetAddress, setFaucetAddress] = useState<AddressType>();
  const [sendValue, setSendValue] = useState("");

  const { chain: ConnectedChain } = useAccount();

  const faucetTxn = useTransactor(localWalletClient);

  useEffect(() => {
    const getFaucetAddress = async () => {
      try {
        const accounts = await localWalletClient.getAddresses();
        setFaucetAddress(accounts[FAUCET_ACCOUNT_INDEX]);
      } catch (error) {
        toast.error(
          <>
            <p className="font-bold mt-0 mb-1">Cannot connect to local provider</p>
            <p className="m-0">
              - Did you forget to run <code className="italic bg-base-300 text-base font-bold">yarn chain</code> ?
            </p>
            <p className="mt-1 break-normal">
              - Or you can change <code className="italic bg-base-300 text-base font-bold">targetNetwork</code> in{" "}
              <code className="italic bg-base-300 text-base font-bold">scaffold.config.ts</code>
            </p>
          </>,
        );
        console.error("⚡️ ~ file: Faucet.tsx:getFaucetAddress ~ error", error);
      }
    };
    getFaucetAddress();
  }, []);

  const sendETH = async () => {
    if (!faucetAddress || !inputAddress) {
      return;
    }
    try {
      setLoading(true);
      await faucetTxn({
        to: inputAddress,
        value: parseEther(sendValue as `${number}`),
        account: faucetAddress,
      });
      setLoading(false);
      setInputAddress(undefined);
      setSendValue("");
    } catch (error) {
      console.error("⚡️ ~ file: Faucet.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // Render only on local chain
  if (ConnectedChain?.id !== hardhat.id) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="justify-center font">
          <Banknote />
          <span className="mb-[0.6px]">Faucet</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Local Faucet</DialogTitle>
        </DialogHeader>
        <article className="flex flex-col justify-center items-center gap-2">
          <div className="w-full flex justify-center flex-col items-center gap-2">
            <span className="text-sm font-bold">From:</span>
            <Address address={faucetAddress} onlyEnsOrAddress />
          </div>

          <div>
            <span className="text-sm font-bold pl-3">Available:</span>
            <Balance address={faucetAddress} />
          </div>

          <div className="relative flex w-full px-10 flex-col justify-center gap-5">
            <AddressInput
              placeholder="Destination Address"
              value={inputAddress ?? ""}
              onChange={value => setInputAddress(value as AddressType)}
            />
            <EtherInput placeholder="Amount to send" value={sendValue} onChange={value => setSendValue(value)} />
            <Button onClick={sendETH} disabled={loading}>
              {!loading ? <Banknote className="mt-0.5" /> : <span className="loading loading-spinner loading-sm" />}
              Send
            </Button>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
};
