import { create } from "zustand";
import { persist } from "zustand/middleware";

type OnboardingStore = {
  /** Tour key (DAO address in lowercase, or "global") -> ids of the guided tours already seen there. */
  completedTours: Record<string, string[]>;
  completeTour: (key: string, tourId: string) => void;
  /** Makes every tour of a DAO (or every global tour) show up again. */
  resetTours: (key: string) => void;
  /** Makes every tour everywhere show up again. */
  resetAllTours: () => void;
};

/** Pages outside a DAO (the DAO list) share this key. */
export const GLOBAL_TOUR_KEY = "global";

export const getTourKey = (daoAddress: string) => (daoAddress === "" ? GLOBAL_TOUR_KEY : daoAddress.toLowerCase());

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    set => ({
      completedTours: {},
      completeTour: (key, tourId) =>
        set(state => {
          const seen = state.completedTours[key] ?? [];
          if (seen.includes(tourId)) return state;

          return { completedTours: { ...state.completedTours, [key]: [...seen, tourId] } };
        }),
      resetTours: key =>
        set(state => {
          const rest = { ...state.completedTours };
          delete rest[key];
          return { completedTours: rest };
        }),
      resetAllTours: () => set({ completedTours: {} }),
    }),
    { name: "agora_onboarding" },
  ),
);
