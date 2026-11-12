export const LOCALES = ["en", "cs"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP 47 tags handed to `Intl` formatters. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  cs: "cs-CZ",
};

/** Open Graph `og:locale` values. */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  cs: "cs_CZ",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
