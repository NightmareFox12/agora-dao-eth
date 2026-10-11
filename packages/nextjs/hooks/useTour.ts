"use client";

import { useCallback, useEffect, useRef } from "react";
import { type DriveStep, type Driver, driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useDaoStore } from "~~/services/store/dao.store";
import { getTourKey, useOnboardingStore } from "~~/services/store/onboarding.store";

type UseTourOptions = {
  /** Wait until the page has the content the steps point at. */
  ready?: boolean;
};

const isVisible = (selector: string) => {
  const element = document.querySelector(selector);
  return element !== null && element.getClientRects().length > 0;
};

/**
 * Guided tour built with driver.js. It starts by itself the first time a user opens a page in a DAO
 * and remembers it (per DAO address) so it does not show up again. `start` replays it on demand.
 *
 * Keep `steps` stable (define it outside the component).
 */
export const useTour = (tourId: string, steps: DriveStep[], { ready = true }: UseTourOptions = {}) => {
  const { daoAddress } = useDaoStore();
  const completeTour = useOnboardingStore(state => state.completeTour);
  const isCompleted = useOnboardingStore(state =>
    (state.completedTours[getTourKey(daoAddress)] ?? []).includes(tourId),
  );

  const activeTour = useRef<Driver | null>(null);
  const isLeavingPage = useRef(false);

  const start = useCallback(() => {
    // the nav links, for example, are hidden on mobile: skip the steps whose target is not on screen
    const availableSteps = steps.filter(step => typeof step.element !== "string" || isVisible(step.element));
    if (availableSteps.length === 0 || daoAddress === "") return;

    activeTour.current?.destroy();
    activeTour.current = driver({
      steps: availableSteps,
      popoverClass: "agora-tour",
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Entendido",
      stagePadding: 6,
      stageRadius: 10,
      overlayOpacity: 0.6,
      // closing it (finishing or skipping) counts as seen, so it does not come back
      onDestroyed: () => {
        if (!isLeavingPage.current) completeTour(daoAddress, tourId);
      },
    });
    activeTour.current.drive();
  }, [steps, daoAddress, tourId, completeTour]);

  useEffect(() => {
    if (!ready || isCompleted || daoAddress === "") return;

    const timeout = setTimeout(start, 800);
    return () => clearTimeout(timeout);
  }, [ready, isCompleted, daoAddress, start]);

  // leaving the page must not mark the tour as seen
  useEffect(() => {
    isLeavingPage.current = false;

    return () => {
      isLeavingPage.current = true;
      activeTour.current?.destroy();
      activeTour.current = null;
    };
  }, []);

  return { start, isCompleted };
};
