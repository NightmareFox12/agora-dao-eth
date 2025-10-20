"use client";

import { ChangeEvent, FocusEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CommonInputProps } from "~~/components/scaffold-eth";
import { Input } from "~~/components/ui/shadcn/input";

type InputBaseProps<T> = CommonInputProps<T> & {
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  reFocus?: boolean;
};

export const InputBase = <T extends { toString: () => string } | undefined = string>({
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  prefix,
  suffix,
  reFocus,
}: InputBaseProps<T>) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);

  const inputReft = useRef<HTMLInputElement>(null);

  let modifier = "";
  if (error) {
    modifier = "border-red-500";
  } else if (disabled) {
    modifier = "border-input bg-base-200";
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value as unknown as T);
    },
    [onChange],
  );

  // Runs only when reFocus prop is passed, useful for setting the cursor
  // at the end of the input. Example AddressInput
  const onFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (reFocus !== undefined) {
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
    setIsFocus(true);
  };

  useEffect(() => {
    inputReft.current?.addEventListener("focusout", () => setIsFocus(false));
  }, []);

  useEffect(() => {
    if (reFocus !== undefined && reFocus === true) inputReft.current?.focus();
  }, [reFocus]);

  return (
    <div
      className={`dark:bg-secondary flex border-1 bg-base-200 rounded-sm text-accent ${isFocus ? `focus-visible:border-ring ring-[3px] ${error ? "ring-red-500/50" : "ring-ring/50"} transition` : "transition"} ${modifier}`}
    >
      {prefix}
      <Input
        className="border-0 focus-within:border-transparent focus-visible:ring-0 text-primary"
        placeholder={placeholder}
        name={name}
        value={value?.toString()}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off"
        ref={inputReft}
        onFocus={onFocus}
      />
      {suffix}
    </div>
  );
};

//  <div className={`flex border-2 border-base-300 bg-base-200 rounded-full text-accent ${modifier}`}>
//       {prefix}
//       <input
//         className="input input-ghost focus-within:border-transparent focus:outline-hidden focus:bg-transparent h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/70 text-base-content/70 focus:text-base-content/70"
//         placeholder={placeholder}
//         name={name}
//         value={value?.toString()}
//         onChange={handleChange}
//         disabled={disabled}
//         autoComplete="off"
//         ref={inputReft}
//         onFocus={onFocus}
//       />
//       {suffix}
//     </div>
