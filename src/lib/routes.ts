import { Locale } from "@/i18n/config";

/**
 * Every public URL is built here so the two language trees stay in sync.
 * English lives at the root, Czech under `/cs` with translated segments:
 *   /weather/czechia/prague/14-day  ↔  /cs/pocasi/cesko/praha/14-dni
 */

export const SITE_URL = "https://www.weather-now.app";

export type CityView =
  | "overview"
  | "tomorrow"
  | "hourly"
  | "14-day"
  | "air-quality"
  | "sunrise-sunset"
  | "climate";

export const CITY_VIEWS: CityView[] = [
  "overview",
  "tomorrow",
  "hourly",
  "14-day",
  "air-quality",
  "sunrise-sunset",
  "climate",
];

type StaticPage = "about" | "privacy" | "terms" | "widget";

interface Segments {
  prefix: string;
  weather: string;
  pages: Record<StaticPage, string>;
  views: Record<Exclude<CityView, "overview">, string>;
  months: string[];
}

const SEGMENTS: Record<Locale, Segments> = {
  en: {
    prefix: "",
    weather: "weather",
    pages: {
      about: "about",
      privacy: "privacy",
      terms: "terms",
      widget: "widget",
    },
    views: {
      tomorrow: "tomorrow",
      hourly: "hourly",
      "14-day": "14-day",
      "air-quality": "air-quality",
      "sunrise-sunset": "sunrise-sunset",
      climate: "climate",
    },
    months: [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ],
  },
  cs: {
    prefix: "/cs",
    weather: "pocasi",
    pages: {
      about: "o-aplikaci",
      privacy: "soukromi",
      terms: "podminky",
      widget: "widget",
    },
    views: {
      tomorrow: "zitra",
      hourly: "po-hodinach",
      "14-day": "14-dni",
      "air-quality": "kvalita-vzduchu",
      "sunrise-sunset": "vychod-a-zapad-slunce",
      climate: "podnebi",
    },
    months: [
      "leden",
      "unor",
      "brezen",
      "duben",
      "kveten",
      "cerven",
      "cervenec",
      "srpen",
      "zari",
      "rijen",
      "listopad",
      "prosinec",
    ],
  },
};

/** Minimal shapes so this module doesn't depend on the data files. */
interface Sluggable {
  slug: Record<Locale, string>;
}

export function homePath(locale: Locale): string {
  return SEGMENTS[locale].prefix || "/";
}

export function pagePath(locale: Locale, page: StaticPage): string {
  const s = SEGMENTS[locale];
  return `${s.prefix}/${s.pages[page]}`;
}

export function worldPath(locale: Locale): string {
  const s = SEGMENTS[locale];
  return `${s.prefix}/${s.weather}`;
}

export function countryPath(locale: Locale, country: Sluggable): string {
  return `${worldPath(locale)}/${country.slug[locale]}`;
}

export function placePath(
  locale: Locale,
  country: Sluggable,
  place: Sluggable,
  view: CityView = "overview",
  month?: number
): string {
  const base = `${countryPath(locale, country)}/${place.slug[locale]}`;
  if (view === "overview") return base;
  const s = SEGMENTS[locale];
  const viewPath = `${base}/${s.views[view]}`;
  return view === "climate" && month !== undefined
    ? `${viewPath}/${s.months[month]}`
    : viewPath;
}

export function embedPath(
  locale: Locale,
  country: Sluggable,
  place: Sluggable
): string {
  return `/embed/${locale}/${country.slug[locale]}/${place.slug[locale]}`;
}

/** Inverse of `placePath` for the optional `[[...view]]` segment. */
export function parseCityView(
  locale: Locale,
  segments: string[] | undefined
): { view: CityView; month?: number } | null {
  if (!segments || segments.length === 0) return { view: "overview" };
  const s = SEGMENTS[locale];
  const view = (Object.keys(s.views) as Array<Exclude<CityView, "overview">>).find(
    (key) => s.views[key] === segments[0]
  );
  if (!view) return null;
  if (segments.length === 1) return { view };
  if (view !== "climate" || segments.length !== 2) return null;
  const month = s.months.indexOf(segments[1]);
  return month >= 0 ? { view, month } : null;
}

export function monthSlug(locale: Locale, month: number): string {
  return SEGMENTS[locale].months[month];
}

export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
