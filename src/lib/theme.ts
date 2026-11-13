/**
 * Theme preference shared by the client hook and the server-rendered layout.
 * Kept out of `hooks/useTheme.ts`: that module is "use client", so a server
 * component importing a value from it gets a client reference, not the string.
 */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "weathernow:theme";

/**
 * Inlined in <head> so the `dark` class exists before first paint and the
 * page never flashes the wrong theme.
 */
export const themeBootstrapScript = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)})||'"system"');var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
