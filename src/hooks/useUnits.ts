"use client";

import { useSyncExternalStore } from "react";
import { UnitSystem } from "@/lib/units";
import { useLocalStorage } from "./useLocalStorage";

const noop = () => () => {};

/** Browser-language guess for first-time visitors: °F for US English. */
function guess(): UnitSystem {
  const lang = navigator.language || "";
  return /-(US|LR|MM)$/i.test(lang) ? "imperial" : "metric";
}

/**
 * The visitor's unit system. Server render and hydration always use metric so
 * markup matches; the stored (or guessed) preference applies right after.
 */
export function useUnits(): [UnitSystem, (units: UnitSystem) => void] {
  const [stored, setStored] = useLocalStorage<UnitSystem | null>("weathernow:units", null);
  const guessed = useSyncExternalStore(noop, guess, () => "metric" as UnitSystem);
  return [stored ?? guessed, setStored];
}
