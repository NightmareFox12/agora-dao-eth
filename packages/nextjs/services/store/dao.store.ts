import { create } from "zustand";

type DaoStore = {
  selectedDao: {
    category: string;
    name: string;
  };
  setSelectedDao: (dao: { category: string; name: string }) => void;
  daoAddress: string;
  setDaoAddress: (address: string) => void;
};

export const useDaoStore = create<DaoStore>(set => ({
  selectedDao: {
    category: "all",
    name: "",
  },
  setSelectedDao: (dao: { category: string; name: string }) => set(() => ({ selectedDao: dao })),
  daoAddress: "",
  setDaoAddress: (address: string) => set(() => ({ daoAddress: address })),
}));
