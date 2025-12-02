import { create } from "zustand";

type DaoStore = {
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

export const useDaoStore = create<DaoStore>(set => ({
  selectedFilter: "all",
  setSelectedFilter: (filter: string) => set(() => ({ selectedFilter: filter })),
}));
