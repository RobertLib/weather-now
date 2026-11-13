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
