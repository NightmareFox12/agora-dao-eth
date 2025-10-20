"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "./ui/shadcn/switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type SwitchThemeProps = {
  className?: string;
};

export const SwitchTheme: React.FC<SwitchThemeProps> = ({ className }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex space-x-2 h-8 items-center justify-center text-sm ${className}`}>
      <Switch checked={isDarkMode} onCheckedChange={handleToggle} />
      {isDarkMode ? <Moon /> : <Sun />}
    </div>
  );
};
