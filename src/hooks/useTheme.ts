"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY, ThemePreference } from "@/lib/theme";
import { useLocalStorage } from "./useLocalStorage";

export type { ThemePreference };

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [preference, setPreference, hydrated] =
    useLocalStorage<ThemePreference>(THEME_STORAGE_KEY, "system");

  useEffect(() => {
    // Before hydration the inline bootstrap script (lib/theme.ts) has already set the class.
    if (!hydrated) return;
    apply(preference);

    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference, hydrated]);

  return { preference, setPreference };
}
