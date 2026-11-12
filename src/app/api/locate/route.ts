import { NextRequest } from "next/server";
import { getCountry, nearestPlace } from "@/lib/places";
import { placePath } from "@/lib/routes";
import { isLocale } from "@/i18n/config";

/**
 * Best guess at the visitor's city from Vercel's IP geolocation headers, so
 * the homepage can show local weather without a permission prompt. Nothing is
 * stored; the response is private and uncached.
 */
export function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") ?? "en";
  const locale = isLocale(lang) ? lang : "en";
  const lat = Number(request.headers.get("x-vercel-ip-latitude"));
  const lon = Number(request.headers.get("x-vercel-ip-longitude"));
  let city = "";
  try {
    city = decodeURIComponent(request.headers.get("x-vercel-ip-city") ?? "");
  } catch {
    /* malformed header — ignore the name */
  }
  const cc = request.headers.get("x-vercel-ip-country") ?? "";
  const headers = { "Cache-Control": "private, no-store" };

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    return Response.json({ found: false }, { headers });
  }

  const near = nearestPlace(lat, lon, 30);
  if (near) {
    const country = getCountry(near.place.cc)!;
    return Response.json(
      {
        found: true,
        name: near.place[locale],
        cc: near.place.cc,
        lat: near.place.lat,
        lon: near.place.lon,
        path: placePath(locale, country, near.place),
      },
      { headers }
    );
  }

  return Response.json(
    { found: true, name: city || null, cc, lat, lon },
    { headers }
  );
}
