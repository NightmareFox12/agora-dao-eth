import { create } from "zustand";

type HeaderStore = {
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;
};

export const useHeaderStore = create<HeaderStore>(set => ({
  showHeader: false,
  setShowHeader: (show: boolean) => set(() => ({ showHeader: show })),
}));
