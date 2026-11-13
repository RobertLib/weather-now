import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Locale } from "@/i18n/config";
import { describe, getDictionary } from "@/i18n";
import {
  CONTINENT_ORDER,
  COUNTRIES,
  PLACES,
  getCountryBySlug,
  isCountryHubIndexed,
  placeRegion,
  placesIn,
} from "@/lib/places";
import { countryPath, homePath, placePath, worldPath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getSnapshots } from "@/lib/server-data";
import { DEFAULT_THEME } from "@/lib/conditions";
import WeatherBackground from "@/components/WeatherBackground";
import Breadcrumbs from "@/components/Breadcrumbs";
import WeatherIcon from "@/components/WeatherIcon";
import SearchBar from "@/components/SearchBar";
import { Temp } from "@/components/Units";
import { UnitToggle } from "@/components/Toggles";

function collator(locale: Locale) {
  return new Intl.Collator(locale === "cs" ? "cs" : "en");
}

/* ------------------------------------------------------------------ world */

export function worldMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return pageMetadata({
    locale,
    title: t.world.title,
    description: t.world.description(PLACES.length),
    path: worldPath(locale),
    alternates: { en: worldPath("en"), cs: worldPath("cs") },
    absoluteTitle: true,
  });
}

export function WorldView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const sort = collator(locale);
  const byContinent = CONTINENT_ORDER.map((code) => ({
    code,
    countries: COUNTRIES.filter((c) => c.continent === code).sort((a, b) => sort.compare(a[locale], b[locale])),
  })).filter((g) => g.countries.length);

  return (
    <>
      <WeatherBackground theme={DEFAULT_THEME} />
      <div className="mx-auto max-w-5xl space-y-5 px-3 pt-5 pb-12 sm:px-4 sm:pt-7">
        <div>
          <Breadcrumbs
            crumbs={[
              { name: t.common.home, path: homePath(locale) },
              { name: t.common.world, path: worldPath(locale) },
            ]}
            label={t.common.breadcrumb}
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
            {t.world.h1}
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-base">{t.world.lead(PLACES.length, COUNTRIES.length)}</p>
        </div>
        <SearchBar />
        {byContinent.map((group) => (
          <section key={group.code} className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
            <h2 className="font-display mb-3 text-lg font-semibold">{t.continents[group.code]}</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {group.countries.map((c) => (
                <li key={c.cc}>
                  <Link href={countryPath(locale, c)} className="glass-soft block rounded-xl px-3 py-2 hover:-translate-y-0.5">
                    <span className="block truncate text-sm font-semibold">{c[locale]}</span>
                    <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                      {t.world.cities(placesIn(c.cc).length)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- country */

export function countryMetadata(locale: Locale, slug: string): Metadata {
  const country = getCountryBySlug(locale, slug);
  if (!country) return {};
  const t = getDictionary(locale);
  const places = placesIn(country.cc);
  const sample = places.slice(0, 3).map((p) => p[locale]).join(", ");
  return pageMetadata({
    locale,
    title: t.country.title(country[locale]),
    description: t.country.description(country[locale], places.length, sample),
    path: countryPath(locale, country),
    alternates: { en: countryPath("en", country), cs: countryPath("cs", country) },
    absoluteTitle: true,
    noindex: !isCountryHubIndexed(country.cc),
  });
}

export async function CountryView({ locale, slug }: { locale: Locale; slug: string }) {
  const country = getCountryBySlug(locale, slug);
  if (!country) notFound();
  const t = getDictionary(locale);
  const places = placesIn(country.cc);
  const snaps = await getSnapshots(places);
  const rows = places.map((place, i) => ({ place, snap: snaps[i] }));
  const live = rows.filter((r) => r.snap);
  const warmest = live.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.snap!.temp > b.snap!.temp ? r : b), null);
  const coldest = live.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.snap!.temp < b.snap!.temp ? r : b), null);
  const sort = collator(locale);
  const alphabetical = [...rows].sort((a, b) => sort.compare(a.place[locale], b.place[locale]));
  const name = country[locale];

  return (
    <>
      <WeatherBackground theme={DEFAULT_THEME} />
      <div className="mx-auto max-w-5xl space-y-5 px-3 pt-5 pb-12 sm:px-4 sm:pt-7">
        <div>
          <Breadcrumbs
            crumbs={[
              { name: t.common.home, path: homePath(locale) },
              { name: t.common.world, path: worldPath(locale) },
              { name, path: countryPath(locale, country) },
            ]}
            label={t.common.breadcrumb}
          />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
              {t.country.h1(name)}
            </h1>
            <UnitToggle />
          </div>
          <p className="mt-2 max-w-3xl text-sm text-white/90 sm:text-base">
            {t.country.lead(name, places.length)}{" "}
            {warmest && warmest !== coldest && (
              <>
                {t.country.warmest(warmest.place[locale], warmest.snap!.temp)}{" "}
                {t.country.coldest(coldest!.place[locale], coldest!.snap!.temp)}
              </>
            )}
          </p>
        </div>
        <SearchBar />
        <section className="glass animate-rise rounded-3xl p-3 text-slate-800 sm:p-5 dark:text-slate-100">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {alphabetical.map(({ place, snap }) => (
              <li key={place.id}>
                <Link
                  href={placePath(locale, country, place)}
                  className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-transform hover:-translate-y-0.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{place[locale]}</span>
                    {placeRegion(place, locale) && (
                      <span className="block truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                        {placeRegion(place, locale)}
                      </span>
                    )}
                  </span>
                  {snap && (
                    <span className="flex shrink-0 items-center gap-1.5" title={describe(t, snap.code)}>
                      <WeatherIcon code={snap.code} night={!snap.isDay} className="h-7 w-7" animated={false} />
                      <span className="tabular text-base font-bold">
                        <Temp c={snap.temp} />
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
