"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { homePath, pagePath, worldPath } from "@/lib/routes";
import LanguageLink from "./LanguageLink";

export default function Navigation() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const home = homePath(locale);
  const other = locale === "en" ? "cs" : "en";

  const links = [
    { href: home, label: t.nav.home, exact: true, hideMobile: false },
    { href: worldPath(locale), label: t.nav.countries, exact: false, hideMobile: false },
    { href: pagePath(locale, "widget"), label: t.nav.widget, exact: false, hideMobile: true },
    { href: pagePath(locale, "about"), label: t.nav.about, exact: false, hideMobile: true },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/15 bg-white/8 backdrop-blur-xl"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label={t.nav.main}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link
          href={home}
          className="group flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          aria-label="WeatherNow"
        >
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rounded-full bg-linear-to-br from-amber-300 to-orange-500 opacity-90 transition-transform group-hover:scale-110" />
            <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-white" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6 18a4.2 4.2 0 0 1 .6-8.36A5.6 5.6 0 0 1 17.1 11a3.7 3.7 0 0 1-.7 7z"
              />
            </svg>
          </span>
          <span className="font-display hidden text-lg font-bold tracking-tight text-white min-[400px]:inline">
            Weather
            <span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
              Now
            </span>
          </span>
        </Link>

        <ul className="flex items-center gap-0.5 sm:gap-1">
          {links.map(({ href, label, exact, hideMobile }) => (
            <li key={href} className={hideMobile ? "hidden sm:block" : undefined}>
              <Link
                href={href}
                aria-current={isActive(href, exact) ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-sm font-medium transition-all sm:px-3 ${
                  isActive(href, exact)
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/15 hover:text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <LanguageLink
              to={other}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-sm font-medium text-white/85 transition-all hover:bg-white/15 hover:text-white"
              title={t.nav.language}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t.nav.switchTo}</span>
              <span className="sm:hidden">{other.toUpperCase()}</span>
            </LanguageLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
