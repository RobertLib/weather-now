import { COUNTRIES, PLACES } from "@/lib/places";
import type { PlaceIndex } from "@/lib/places-client";

// Built once at deploy time and served from the CDN (which a deploy purges).
export const dynamic = "force-static";

export function GET() {
  const index: PlaceIndex = {
    countries: Object.fromEntries(
      COUNTRIES.map((c) => [c.cc, [c.en, c.cs, c.slug.en, c.slug.cs]])
    ),
    places: PLACES.map((p) => [p.id, p.cc, p.en, p.cs, p.slug.en, p.slug.cs, p.lat, p.lon]),
  };
  return Response.json(index, {
    // Browsers keep it for an hour only: after a deploy that adds or removes
    // places, a long-cached copy would suggest pages that no longer exist.
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
