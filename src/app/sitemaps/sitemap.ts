import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES, Locale } from "@/i18n/config";
import { COUNTRIES, PLACES, getCountry, isCountryHubIndexed } from "@/lib/places";
import { getClimate, isClimateIndexed } from "@/lib/climate";
import {
  CITY_VIEWS,
  CityView,
  absoluteUrl,
  countryPath,
  homePath,
  pagePath,
  placePath,
  worldPath,
} from "@/lib/routes";

/**
 * Split sitemaps (listed by /sitemap.xml): site pages, then every city page
 * per language. Each URL carries its hreflang alternates. Forecast pages get
 * no lastmod — they change hourly, and a lastmod that always says "now" is
 * ignored by search engines anyway.
 */

export const SITEMAP_IDS = ["pages", "en", "cs"] as const;

/** When the static datasets (places, climate) were last regenerated. */
const DATA_UPDATED = new Date("2026-11-13");

export function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

function entry(
  paths: Record<Locale, string>,
  locale: Locale,
  extra: Partial<MetadataRoute.Sitemap[number]> = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(paths[locale]),
    alternates: {
      // Same set as the pages' own hreflang tags, x-default included.
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(paths[l])])),
        "x-default": absoluteUrl(paths[DEFAULT_LOCALE]),
      },
    },
    ...extra,
  };
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;

  if (id === "pages") {
    const pages: Array<Record<Locale, string>> = [
      { en: homePath("en"), cs: homePath("cs") },
      { en: worldPath("en"), cs: worldPath("cs") },
      ...COUNTRIES.filter((c) => isCountryHubIndexed(c.cc)).map((c) => ({
        en: countryPath("en", c),
        cs: countryPath("cs", c),
      })),
      ...(["widget", "about", "privacy", "terms"] as const).map((p) => ({
        en: pagePath("en", p),
        cs: pagePath("cs", p),
      })),
    ];
    return LOCALES.flatMap((locale) => pages.map((paths) => entry(paths, locale)));
  }

  const locale = id as Locale;
  return PLACES.flatMap((place) => {
    const country = getCountry(place.cc);
    if (!country) return [];
    // Climate pages that only repeat a bigger place's normals are noindex.
    const climate = getClimate(place.id) && isClimateIndexed(place.id);
    const views = CITY_VIEWS.filter((v) => v !== "climate" || climate);
    const at = (view: CityView, month?: number) => ({
      en: placePath("en", country, place, view, month),
      cs: placePath("cs", country, place, view, month),
    });
    return [
      ...views.map((view) =>
        entry(at(view), locale, view === "climate" ? { lastModified: DATA_UPDATED } : {})
      ),
      ...(climate
        ? Array.from({ length: 12 }, (_, m) =>
            entry(at("climate", m), locale, { lastModified: DATA_UPDATED })
          )
        : []),
    ];
  });
}
