import { Locale } from "@/i18n/config";

/**
 * Slim copy of the curated place index for the browser, served as a static
 * JSON route and fetched on first use so it never weighs down page loads.
 */

/** [id, cc, nameEn, nameCs, slugEn, slugCs, lat, lon] */
export type IndexPlace = [number, string, string, string, string, string, number, number];

export interface PlaceIndex {
  /** cc → [nameEn, nameCs, slugEn, slugCs] */
  countries: Record<string, [string, string, string, string]>;
  places: IndexPlace[];
}

let pending: Promise<PlaceIndex> | null = null;

export function loadPlaceIndex(): Promise<PlaceIndex> {
  pending ??= fetch("/api/places")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<PlaceIndex>;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });
  return pending;
}

const L = (locale: Locale) => (locale === "en" ? 0 : 1);

export function indexPlaceName(p: IndexPlace, locale: Locale): string {
  return p[2 + L(locale)] as string;
}

export function indexCountryName(index: PlaceIndex, cc: string, locale: Locale): string {
  return index.countries[cc]?.[L(locale)] ?? cc;
}

export function indexPlacePath(index: PlaceIndex, p: IndexPlace, locale: Locale): string {
  const country = index.countries[p[1]];
  const prefix = locale === "en" ? "/weather" : "/cs/pocasi";
  return `${prefix}/${country[2 + L(locale)]}/${p[4 + L(locale)] as string}`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Prefix and word-boundary matches against both language names. */
export function matchPlaces(index: PlaceIndex, query: string, limit = 4): IndexPlace[] {
  const term = normalize(query);
  if (term.length < 2) return [];
  const scored: Array<{ p: IndexPlace; score: number }> = [];
  for (const p of index.places) {
    let score = 9;
    for (const name of [normalize(p[2]), normalize(p[3])]) {
      if (name === term) score = Math.min(score, 0);
      else if (name.startsWith(term)) score = Math.min(score, 1);
      else if (name.split(/[\s-]/).some((w) => w.startsWith(term))) score = Math.min(score, 2);
    }
    if (score < 9) scored.push({ p, score });
  }
  // The index is sorted by population, so a stable sort keeps big cities first.
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((s) => s.p);
}

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((bLat - aLat) * rad) / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(((bLon - aLon) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function nearestIndexPlace(
  index: PlaceIndex,
  lat: number,
  lon: number,
  maxKm: number
): IndexPlace | null {
  let best: IndexPlace | null = null;
  let bestKm = maxKm;
  for (const p of index.places) {
    const d = km(lat, lon, p[6], p[7]);
    if (d <= bestKm) {
      best = p;
      bestKm = d;
    }
  }
  return best;
}

export function findIndexPlace(index: PlaceIndex, id: number): IndexPlace | null {
  return index.places.find((p) => p[0] === id) ?? null;
}
