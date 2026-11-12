import { Locale } from "./config";
import en, { Dictionary } from "./en";
import cs from "./cs";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, cs };

/** Both dictionaries are small, so they are bundled rather than lazy-loaded. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Weather description for a WMO code, never empty. */
export function describe(t: Dictionary, code: number): string {
  return t.wmo[code] ?? t.wmo[Math.floor(code / 10) * 10] ?? t.wmo[3];
}
