import { create } from "zustand";
import { persist } from "zustand/middleware";

type OnboardingStore = {
  /** DAO address (lowercase) -> ids of the guided tours already seen in that DAO. */
  completedTours: Record<string, string[]>;
  completeTour: (daoAddress: string, tourId: string) => void;
  /** Makes every tour of a DAO show up again. */
  resetTours: (daoAddress: string) => void;
};

export const getTourKey = (daoAddress: string) => daoAddress.toLowerCase();

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    set => ({
      completedTours: {},
      completeTour: (daoAddress, tourId) =>
        set(state => {
          const key = getTourKey(daoAddress);
          const seen = state.completedTours[key] ?? [];
          if (seen.includes(tourId)) return state;

          return { completedTours: { ...state.completedTours, [key]: [...seen, tourId] } };
        }),
      resetTours: daoAddress =>
        set(state => {
          const rest = { ...state.completedTours };
          delete rest[getTourKey(daoAddress)];
          return { completedTours: rest };
        }),
    }),
    { name: "agora_onboarding" },
  ),
);
