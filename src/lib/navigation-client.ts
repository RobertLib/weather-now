import { Locale } from "@/i18n/config";
import { homePath } from "@/lib/routes";
import { findIndexPlace, indexPlacePath, loadPlaceIndex, nearestIndexPlace } from "@/lib/places-client";

/**
 * Where a picked location should take the visitor: its canonical city page
 * when we have one (same GeoNames id, or a curated city within 10 km),
 * otherwise the homepage dashboard with coordinates in the query string.
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
    lat: loc.lat.toFixed(4),
    lon: loc.lon.toFixed(4),
  });
  if (loc.name) params.set("name", loc.name);
  if (loc.cc) params.set("cc", loc.cc);
  const base = homePath(locale);
  return `${base}?${params}`;
}
