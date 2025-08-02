"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "weathernow:theme";

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [preference, setPreference, hydrated] =
    useLocalStorage<ThemePreference>(STORAGE_KEY, "system");

  useEffect(() => {
    // Before hydration the inline bootstrap script has already set the class.
    if (!hydrated) return;
    apply(preference);

    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference, hydrated]);

  const cycle = useCallback(() => {
    setPreference((current) =>
      current === "system" ? "light" : current === "light" ? "dark" : "system"
    );
  }, [setPreference]);

  return { preference, setPreference, cycle };
}

/**
 * Inlined in <head> so the `dark` class exists before first paint and the
 * page never flashes the wrong theme.
 */
export const themeBootstrapScript = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)})||'"system"');var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
