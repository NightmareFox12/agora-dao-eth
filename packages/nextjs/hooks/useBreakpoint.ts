import { useEffect, useState } from "react";

const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
};

export function useBreakpoint() {
  const [isSm, setIsSm] = useState<boolean>(false);
  const [isMd, setIsMd] = useState<boolean>(false);
  const [isLg, setIsLg] = useState<boolean>(false);
  const [isXl, setIsXl] = useState<boolean>(false);
  const [is2Xl, setIs2Xl] = useState<boolean>(false);

  useEffect(() => {
    const mediaQueries = {
      sm: window.matchMedia(breakpoints.sm),
      md: window.matchMedia(breakpoints.md),
      lg: window.matchMedia(breakpoints.lg),
      xl: window.matchMedia(breakpoints.xl),
      "2xl": window.matchMedia(breakpoints["2xl"]),
    };

    const update = () => {
      setIsSm(mediaQueries.sm.matches);
      setIsMd(mediaQueries.md.matches);
      setIsLg(mediaQueries.lg.matches);
      setIsXl(mediaQueries.xl.matches);
      setIs2Xl(mediaQueries["2xl"].matches);
    };

    update(); // Initial check

    Object.values(mediaQueries).forEach(mq => mq.addEventListener("change", update));

    return () => {
      Object.values(mediaQueries).forEach(mq => mq.removeEventListener("change", update));
    };
  }, []);

  return { isSm, isMd, isLg, isXl, is2Xl };
}
