import "server-only";
import placesData from "@/data/places.json";
import countriesData from "@/data/countries.json";
import { LOCALES, Locale } from "@/i18n/config";
import { POPULAR } from "@/lib/popular";
import { placePath } from "@/lib/routes";
import type { PlaceLabels } from "@/types/weather";

/**
 * The curated place index: every city that gets its own indexable pages.
 * Server-side only — the browser fetches a slimmer copy from `/api/places`
 * (see `places-client.ts`).
 */

export interface Place {
  id: number;
  cc: string;
  en: string;
  cs: string;
  slug: Record<Locale, string>;
  a1?: Record<Locale, string>;
  lat: number;
  lon: number;
  ele: number;
  tz: string;
  pop: number;
}

export interface Country {
  cc: string;
  en: string;
  cs: string;
  slug: Record<Locale, string>;
  continent: string;
}

export const PLACES = placesData as Place[];

export const COUNTRIES: Country[] = Object.entries(
  countriesData as Record<string, Omit<Country, "cc">>
).map(([cc, country]) => ({ cc, ...country }));

const COUNTRY_BY_CC = new Map(COUNTRIES.map((c) => [c.cc, c]));

const COUNTRY_BY_SLUG: Record<Locale, Map<string, Country>> = {
  en: new Map(COUNTRIES.map((c) => [c.slug.en, c])),
  cs: new Map(COUNTRIES.map((c) => [c.slug.cs, c])),
};

const PLACES_BY_CC = new Map<string, Place[]>();
for (const place of PLACES) {
  const list = PLACES_BY_CC.get(place.cc) ?? [];
  list.push(place);
  PLACES_BY_CC.set(place.cc, list);
}

export const CONTINENT_ORDER = ["EU", "NA", "AS", "SA", "AF", "OC"];

export function getCountry(cc: string): Country | undefined {
  return COUNTRY_BY_CC.get(cc);
}

export function getCountryBySlug(locale: Locale, slug: string): Country | undefined {
  return COUNTRY_BY_SLUG[locale].get(slug);
}

/** Places in a country, largest first. */
export function placesIn(cc: string): Place[] {
  return PLACES_BY_CC.get(cc) ?? [];
}

/**
 * Whether a country hub is worth indexing. A hub with a single city only
 * repeats that city's page, so it stays `noindex, follow` and out of the sitemap.
 */
export function isCountryHubIndexed(cc: string): boolean {
  return placesIn(cc).length >= 2;
}

export function getPlaceBySlug(
  locale: Locale,
  countrySlug: string,
  placeSlug: string
): { place: Place; country: Country } | null {
  const country = getCountryBySlug(locale, countrySlug);
  if (!country) return null;
  const place = placesIn(country.cc).find((p) => p.slug[locale] === placeSlug);
  return place ? { place, country } : null;
}

/**
 * The place's region (admin1) when it adds something: many cities are their
 * own region ("Prague, Prague"), which would only repeat the name.
 */
export function placeRegion(place: Place, locale: Locale): string | undefined {
  const region = place.a1?.[locale];
  return region && region !== place[locale] ? region : undefined;
}

/** Name, country and canonical path of a curated place in every language. */
export function placeLabels(place: Place, country: Country): PlaceLabels {
  return Object.fromEntries(
    LOCALES.map((l) => [l, { name: place[l], countryName: country[l], path: placePath(l, country, place) }])
  );
}

/** Great-circle distance in km. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function nearbyPlaces(
  place: Place,
  limit = 8,
  maxKm = 600
): Array<{ place: Place; km: number }> {
  return PLACES.filter((p) => p.id !== place.id)
    .map((p) => ({ place: p, km: distanceKm(place, p) }))
    .filter((entry) => entry.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function nearestPlace(
  lat: number,
  lon: number,
  maxKm: number
): { place: Place; km: number } | null {
  let best: { place: Place; km: number } | null = null;
  for (const place of PLACES) {
    const km = distanceKm({ lat, lon }, place);
    if (km <= maxKm && (!best || km < best.km)) best = { place, km };
  }
  return best;
}

/** The curated popular destinations (see `lib/popular.ts`); unknown entries are skipped. */
export function popularPlaces(locale: Locale): Place[] {
  return POPULAR[locale].flatMap(([cc, slug]) => {
    const place = placesIn(cc).find((p) => p.slug.en === slug);
    return place ? [place] : [];
  });
}

/** Countries with the most curated places, for footer links. */
export function topCountries(locale: Locale, limit = 8): Country[] {
  const preferred = locale === "cs" ? ["CZ", "SK", "AT", "DE", "HR", "IT", "GR", "ES"] : ["US", "GB", "CA", "AU", "DE", "FR", "IT", "ES"];
  return preferred.flatMap((cc) => {
    const c = getCountry(cc);
    return c ? [c] : [];
  }).slice(0, limit);
}
