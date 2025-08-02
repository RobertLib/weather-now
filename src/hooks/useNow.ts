"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}

/** Quantised to the minute so repeated reads inside one render are identical. */
function snapshot(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

/**
 * The current time as reactive external state, shared by everything that shows
 * a relative label ("updated 4 min ago", "Now", sunset countdown). Returns 0
 * during server render and hydration, where there is no meaningful clock.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
