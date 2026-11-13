import { Locale } from "@/i18n/config";
import { homePath } from "@/lib/routes";
import { findIndexPlace, indexPlacePath, loadPlaceIndex, nearestIndexPlace } from "@/lib/places-client";

/**
 * Where a picked location should take the visitor: its canonical city page
 * when we have one (same GeoNames id, or a curated city within 10 km),
 * otherwise the homepage dashboard with coordinates in the query string.
 *
 * Those coordinates are rounded to two decimals (about 1 km): the URL ends up
 * in browser history, shared links and server logs, and a device's precise
 * GPS fix doesn't belong there. Forecast grids are coarser anyway.
 */
export async function resolvePlaceHref(
  locale: Locale,
  loc: { id?: number; name?: string; lat: number; lon: number; cc?: string }
): Promise<string> {
  try {
    const index = await loadPlaceIndex();
    const hit =
      (loc.id !== undefined ? findIndexPlace(index, loc.id) : null) ??
      nearestIndexPlace(index, loc.lat, loc.lon, 10);
    if (hit) return indexPlacePath(index, hit, locale);
  } catch {
    /* index unavailable — fall back to coordinates */
  }
  const params = new URLSearchParams({
    lat: loc.lat.toFixed(2),
    lon: loc.lon.toFixed(2),
  });
  if (loc.name) params.set("name", loc.name);
  if (loc.cc) params.set("cc", loc.cc);
  const base = homePath(locale);
  return `${base}?${params}`;
}

/** Longest place name taken from a link; real names are far shorter. */
const MAX_LINKED_NAME = 60;

export interface LinkedPlace {
  lat: number;
  lon: number;
  name?: string;
  cc?: string;
}

/**
 * The place a homepage link (`/?lat=…&lon=…&name=…&cc=…`, see
 * `resolvePlaceHref`) asks for, or null when the coordinates are missing or out
 * of range. Anyone can craft such a link, and the name is shown on the
 * dashboard and remembered as the last place, so it is cleaned, capped and
 * dropped when it looks like a web address.
 */
export function placeFromQuery(params: URLSearchParams): LinkedPlace | null {
  const lat = coordinate(params.get("lat"), 90);
  const lon = coordinate(params.get("lon"), 180);
  if (lat === null || lon === null) return null;
  const name = linkedName(params.get("name"));
  const cc = params.get("cc")?.toUpperCase();
  return { lat, lon, ...(name ? { name } : {}), ...(cc && /^[A-Z]{2}$/.test(cc) ? { cc } : {}) };
}

function coordinate(raw: string | null, limit: number): number | null {
  // Number("") is 0, so an empty parameter would otherwise mean 0°.
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

function linkedName(raw: string | null): string | undefined {
  const name = (raw ?? "")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name || /:\/\/|www\.|@|[a-z0-9-]\.[a-z]{2,}\b/i.test(name)) return undefined;
  return name.length > MAX_LINKED_NAME ? `${name.slice(0, MAX_LINKED_NAME - 1).trimEnd()}…` : name;
}
