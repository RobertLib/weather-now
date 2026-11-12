import Link from "next/link";
import { MapPin, Code2 } from "lucide-react";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { Country, Place, nearbyPlaces, getCountry } from "@/lib/places";
import { CityView, CITY_VIEWS, countryPath, homePath, pagePath, placePath, worldPath } from "@/lib/routes";
import { SkyTheme } from "@/lib/conditions";
import { Crumb } from "@/lib/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import WeatherBackground from "@/components/WeatherBackground";
import SearchBar from "@/components/SearchBar";
import FavoritesBar from "@/components/FavoritesBar";
import { ThemeToggle, UnitToggle } from "@/components/Toggles";

export function cityCrumbs(
  locale: Locale,
  country: Country,
  place: Place,
  extra: Crumb[] = []
): Crumb[] {
  const t = getDictionary(locale);
  return [
    { name: t.common.home, path: homePath(locale) },
    { name: t.common.world, path: worldPath(locale) },
    { name: country[locale], path: countryPath(locale, country) },
    { name: place[locale], path: placePath(locale, country, place) },
    ...extra,
  ];
}

interface CityFrameProps {
  locale: Locale;
  place: Place;
  country: Country;
  view: CityView;
  month?: number;
  h1: string;
  lead?: string;
  crumbs: Crumb[];
  theme?: SkyTheme;
  hasClimate: boolean;
  children: React.ReactNode;
}

/** Shared chrome for every city page: trail, heading, summary, tabs, links out. */
export function CityFrame({
  locale,
  place,
  country,
  view,
  month,
  h1,
  lead,
  crumbs,
  theme,
  hasClimate,
  children,
}: CityFrameProps) {
  const t = getDictionary(locale);
  const views = CITY_VIEWS.filter((v) => v !== "climate" || hasClimate);
  const region = place.a1?.[locale];

  return (
    <>
      {theme && <WeatherBackground theme={theme} />}
      <div className="px-3 pt-5 pb-12 sm:px-4 sm:pt-7">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
          <div>
            <Breadcrumbs crumbs={crumbs} label={t.common.breadcrumb} />
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
                  {h1}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {[region, country[locale]].filter((x, i, a) => x && a.indexOf(x) === i).join(", ")}
                  <span className="text-white/50">·</span>
                  <span>{t.city.elevation(place.ele)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UnitToggle />
                <ThemeToggle />
              </div>
            </header>
            {lead && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/90 drop-shadow sm:text-base">
                {lead}
              </p>
            )}
          </div>

          <SearchBar />
          <FavoritesBar />

          <nav aria-label={t.city.tabsAria} className="scroll-strip -mx-3 px-3 sm:mx-0 sm:px-0">
            <ul className="flex gap-1.5">
              {views.map((v) => {
                const active = v === view && (v !== "climate" || month === undefined);
                const within = v === view;
                return (
                  <li key={v} className="shrink-0">
                    <Link
                      href={placePath(locale, country, place, v)}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-full border px-3.5 py-1.5 text-sm font-medium backdrop-blur-md transition-all ${
                        within
                          ? "border-white/60 bg-white text-slate-900 shadow"
                          : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                      }`}
                    >
                      {t.city.tabs[v]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {children}

          <NearbyLinks locale={locale} place={place} country={country} view={view} month={month} />

          <p className="text-center">
            <Link
              href={`${pagePath(locale, "widget")}?place=${country.slug.en}/${place.slug.en}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
            >
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.city.embedCta}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/** Same view for the nearest cities — the main internal-linking block. */
function NearbyLinks({
  locale,
  place,
  country,
  view,
  month,
}: {
  locale: Locale;
  place: Place;
  country: Country;
  view: CityView;
  month?: number;
}) {
  const t = getDictionary(locale);
  const nearby = nearbyPlaces(place, 8);
  if (!nearby.length) return null;

  return (
    <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
      <h2 className="font-display mb-3 text-base font-semibold tracking-tight sm:text-lg">
        {month !== undefined ? t.views.nearbyInMonth(month) : t.city.nearby}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {nearby.map(({ place: p, km }) => {
          const c = getCountry(p.cc)!;
          return (
            <li key={p.id}>
              <Link
                href={placePath(locale, c, p, view, month)}
                className="glass-soft block rounded-xl px-3 py-2 transition-transform hover:-translate-y-0.5"
              >
                <span className="block truncate text-sm font-semibold">{p[locale]}</span>
                <span className="block text-[0.7rem] text-slate-500 dark:text-slate-400">
                  {t.common.km(Math.round(km))}
                  {p.cc !== place.cc ? ` · ${c[locale]}` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm">
        <Link href={countryPath(locale, country)} className="font-medium text-sky-600 hover:underline dark:text-sky-300">
          {t.city.moreIn(country[locale])} →
        </Link>
      </p>
    </section>
  );
}

/** Glass panel with a heading, for server-rendered sections. */
export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="glass-soft rounded-xl px-3 py-2">
          <dt className="text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {item.label}
          </dt>
          <dd className="tabular text-base font-bold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const tableWrap = "-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0";
export const tableClass = "w-full min-w-[34rem] border-collapse text-left text-sm";
export const thClass =
  "border-b border-slate-900/10 px-2 py-2 text-[0.7rem] font-semibold tracking-wide text-slate-500 uppercase dark:border-white/10 dark:text-slate-400";
export const tdClass = "border-b border-slate-900/5 px-2 py-2 tabular dark:border-white/5";
