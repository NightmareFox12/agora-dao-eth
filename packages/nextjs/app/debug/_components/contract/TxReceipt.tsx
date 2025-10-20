import { CheckCircle, ChevronDown, Files } from "lucide-react";
import { TransactionReceipt } from "viem";
import { ObjectFieldDisplay } from "~~/app/debug/_components/contract";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~~/components/ui/shadcn/collapsible";
import { ScrollArea } from "~~/components/ui/shadcn/scroll-area";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth/useCopyToClipboard";
import { replacer } from "~~/utils/scaffold-eth/common";

export const TxReceipt = ({ txResult }: { txResult: TransactionReceipt }) => {
  const { copyToClipboard: copyTxResultToClipboard, isCopiedToClipboard: isTxResultCopiedToClipboard } =
    useCopyToClipboard();
  return (
    <div className="flex text-sm w-full bg-secondary flex-1 py-2 px-1 gap-2 rounded-md">
      <div className="mt-1 pl-2">
        {isTxResultCopiedToClipboard ? (
          <CheckCircle aria-hidden="true" />
        ) : (
          <Files
            className="cursor-pointer"
            aria-hidden="true"
            onClick={() => copyTxResultToClipboard(JSON.stringify(txResult, replacer, 2))}
          />
        )}
      </div>
      <Collapsible className="w-full">
        <CollapsibleTrigger className="font-semibold flex flex-1 text-start cursor-pointer gap-1 w-full">
          <ChevronDown />
          Transaction Receipt
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-[200px] w-full p-3">
            {Object.entries(txResult).map(([k, v]) => (
              <ObjectFieldDisplay name={k} value={v} size="xs" leftPad={false} key={k} />
            ))}
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
