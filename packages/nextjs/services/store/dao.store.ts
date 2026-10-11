import { create } from "zustand";

export type DaoFilters = {
  name: string;
  /** Category ids. A DAO matches when it has at least one of them. */
  categories: number[];
  onlyMine: boolean;
};

const INITIAL_FILTERS: DaoFilters = {
  name: "",
  categories: [],
  onlyMine: false,
};

type DaoStore = {
  selectedDao: DaoFilters;
  setSelectedDao: (dao: DaoFilters) => void;
  /** Clears the category and "my DAOs" filters but keeps the text search. */
  clearDaoFilters: () => void;
  /** Clears the text search and every filter. */
  clearDaoSearch: () => void;
  daoAddress: string;
  setDaoAddress: (address: string) => void;
};

export const useDaoStore = create<DaoStore>(set => ({
  selectedDao: INITIAL_FILTERS,
  setSelectedDao: (dao: DaoFilters) => set(() => ({ selectedDao: dao })),
  clearDaoFilters: () => set(state => ({ selectedDao: { ...state.selectedDao, categories: [], onlyMine: false } })),
  clearDaoSearch: () => set(() => ({ selectedDao: INITIAL_FILTERS })),
  daoAddress: "",
  setDaoAddress: (address: string) => set(() => ({ daoAddress: address })),
}));
