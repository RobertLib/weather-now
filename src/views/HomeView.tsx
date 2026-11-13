import type { Metadata } from "next";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { describe, getDictionary } from "@/i18n";
import { CONTINENT_ORDER, COUNTRIES, getCountry, placesIn, popularPlaces } from "@/lib/places";
import { countryPath, homePath, placePath, worldPath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getSnapshots } from "@/lib/server-data";
import WeatherIcon from "@/components/WeatherIcon";
import { Temp } from "@/components/Units";
import { ThemeToggle, UnitToggle } from "@/components/Toggles";
import HomeClient from "./HomeClient";

export function homeMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    title: t.home.title,
    description: t.home.description,
    path: homePath(locale),
    alternates: { en: homePath("en"), cs: homePath("cs") },
    absoluteTitle: true,
  });
}

export async function HomeView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const popular = popularPlaces(locale);
  const snaps = await getSnapshots(popular);

  // A handful of countries per continent keeps the block scannable.
  const continents = CONTINENT_ORDER.map((code) => ({
    code,
    countries: COUNTRIES.filter((c) => c.continent === code)
      .sort((a, b) => placesIn(b.cc).length - placesIn(a.cc).length)
      .slice(0, 6),
  })).filter((g) => g.countries.length);

  return (
    <>
      {/* The sky backdrop is painted by HomeClient (neutral, or the live dashboard's). */}
      <div className="px-3 pt-5 pb-12 sm:px-4 sm:pt-8">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
                {t.home.h1}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-white/85">{t.home.lead}</p>
            </div>
            <div className="flex items-center gap-2">
              <UnitToggle />
              <ThemeToggle />
            </div>
          </header>

          <HomeClient />

          <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
            <h2 className="font-display text-base font-semibold tracking-tight sm:text-lg">{t.home.popular}</h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t.home.popularSub}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {popular.map((place, i) => {
                const snap = snaps[i];
                const country = getCountry(place.cc)!;
                return (
                  <li key={place.id}>
                    <Link
                      href={placePath(locale, country, place)}
                      className="glass-soft flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-transform hover:-translate-y-0.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{place[locale]}</span>
                        <span className="block truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {snap ? describe(t, snap.code) : country[locale]}
                        </span>
                      </span>
                      {snap && (
                        <span className="flex shrink-0 items-center gap-1">
                          <WeatherIcon code={snap.code} night={!snap.isDay} className="h-7 w-7" animated={false} />
                          <span className="tabular font-bold">
                            <Temp c={snap.temp} />
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
            <h2 className="font-display mb-3 text-base font-semibold tracking-tight sm:text-lg">{t.home.browse}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {continents.map((group) => (
                <div key={group.code}>
                  <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    {t.continents[group.code]}
                  </h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.countries.map((c) => (
                      <li key={c.cc}>
                        <Link
                          href={countryPath(locale, c)}
                          className="glass-soft inline-block rounded-full px-2.5 py-1 text-xs font-medium hover:bg-sky-500/15"
                        >
                          {c[locale]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              <Link href={worldPath(locale)} className="font-medium text-sky-600 hover:underline dark:text-sky-300">
                {t.home.allCountries} →
              </Link>
            </p>
          </section>

          <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
            <h2 className="font-display mb-3 text-base font-semibold tracking-tight sm:text-lg">{t.home.whyTitle}</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {t.home.why.map(([title, text]) => (
                <div key={title} className="glass-soft rounded-2xl p-3.5">
                  <dt className="text-sm font-semibold">{title}</dt>
                  <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
