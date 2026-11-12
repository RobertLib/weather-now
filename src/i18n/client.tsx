"use client";

import { createContext, useContext } from "react";
import { Locale } from "./config";
import { Dictionary, getDictionary } from "./index";

const LocaleContext = createContext<Locale>("en");

/**
 * Only the locale crosses the server/client boundary — dictionaries contain
 * functions, which can't be serialised, so each side imports them directly.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n(): { locale: Locale; t: Dictionary } {
  const locale = useContext(LocaleContext);
  return { locale, t: getDictionary(locale) };
}
