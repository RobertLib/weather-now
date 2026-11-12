import { Locale } from "@/i18n/config";

/**
 * Hand-picked for the homepage, the footer and the empty search box: the most
 * searched destinations for each audience, as [country code, English slug].
 * Shared by server and client code, so it must stay free of data imports.
 */
export const POPULAR: Record<Locale, Array<[string, string]>> = {
  en: [
    ["GB", "london"],
    ["US", "new-york"],
    ["FR", "paris"],
    ["JP", "tokyo"],
    ["AE", "dubai"],
    ["ES", "barcelona"],
    ["IT", "rome"],
    ["AU", "sydney"],
    ["US", "los-angeles"],
    ["DE", "berlin"],
    ["SG", "singapore"],
    ["CZ", "prague"],
  ],
  cs: [
    ["CZ", "prague"],
    ["CZ", "brno"],
    ["CZ", "ostrava"],
    ["CZ", "plzen"],
    ["CZ", "liberec"],
    ["CZ", "olomouc"],
    ["CZ", "ceske-budejovice"],
    ["CZ", "hradec-kralove"],
    ["SK", "bratislava"],
    ["AT", "vienna"],
    ["HR", "split"],
    ["GB", "london"],
  ],
};
