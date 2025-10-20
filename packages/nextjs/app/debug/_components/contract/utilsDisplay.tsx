import { ReactElement, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { TransactionBase, TransactionReceipt, formatEther, isAddress, isHex } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/shadcn/tooltip";
import { replacer } from "~~/utils/scaffold-eth/common";

type DisplayContent =
  | string
  | number
  | bigint
  | Record<string, any>
  | TransactionBase
  | TransactionReceipt
  | undefined
  | unknown;

type ResultFontSize = "sm" | "base" | "xs" | "lg" | "xl" | "2xl" | "3xl";

export const displayTxResult = (
  displayContent: DisplayContent | DisplayContent[],
  fontSize: ResultFontSize = "base",
): string | ReactElement | number => {
  if (displayContent == null) {
    return "";
  }

  if (typeof displayContent === "bigint") {
    return <NumberDisplay value={displayContent} />;
  }

  if (typeof displayContent === "string") {
    if (isAddress(displayContent)) {
      return <Address address={displayContent} size={fontSize} onlyEnsOrAddress />;
    }

    if (isHex(displayContent)) {
      return displayContent; // don't add quotes
    }
  }

  if (Array.isArray(displayContent)) {
    return <ArrayDisplay values={displayContent} size={fontSize} />;
  }

  if (typeof displayContent === "object") {
    return <StructDisplay struct={displayContent} size={fontSize} />;
  }

  return JSON.stringify(displayContent, replacer, 2);
};

const NumberDisplay = ({ value }: { value: bigint }) => {
  const [isEther, setIsEther] = useState(false);

  const asNumber = Number(value);
  if (asNumber <= Number.MAX_SAFE_INTEGER && asNumber >= Number.MIN_SAFE_INTEGER) {
    return String(value);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" onClick={() => setIsEther(!isEther)}>
          <ArrowRightLeft className="opacity-65" />
          {isEther ? "Ξ" + formatEther(value) : String(value)}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{isEther ? "Multiply by 1e18" : "Divide by 1e18"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const ObjectFieldDisplay = ({
  name,
  value,
  size,
  leftPad = true,
}: {
  name: string;
  value: DisplayContent;
  size: ResultFontSize;
  leftPad?: boolean;
}) => {
  return (
    <div className={`text-sm ${leftPad ? "ml-4" : ""}`}>
      <span className="text-base-content/60  mr-2">{name}:</span>
      <span className="text-base-content break-all text-sm">{displayTxResult(value, size)}</span>
    </div>
  );
};

const ArrayDisplay = ({ values, size }: { values: DisplayContent[]; size: ResultFontSize }) => {
  return (
    <div className="flex flex-col gap-y-1 ">
      {values.length ? "array" : "[]"}
      {values.map((v, i) => (
        <ObjectFieldDisplay key={i} name={`[${i}]`} value={v} size={size} />
      ))}
    </div>
  );
};

const StructDisplay = ({ struct, size }: { struct: Record<string, any>; size: ResultFontSize }) => {
  return (
    <div className="flex flex-col gap-y-1 ">
      struct
      {Object.entries(struct).map(([k, v]) => (
        <ObjectFieldDisplay key={k} name={k} value={v} size={size} />
      ))}
    </div>
  );
};
