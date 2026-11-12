import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import {
  COUNTRIES,
  PLACES,
  getCountry,
  getPlaceBySlug,
  isCountryHubIndexed,
  placeLabels,
  popularPlaces,
} from "@/lib/places";
import { POPULAR } from "@/lib/popular";
import { getClimate } from "@/lib/climate";

describe("place data", () => {
  it("links every place to a known country", () => {
    expect(PLACES.filter((p) => !getCountry(p.cc))).toEqual([]);
  });

  it("has unique slugs per country and language", () => {
    for (const locale of LOCALES) {
      const keys = PLACES.map((p) => `${p.cc}/${p.slug[locale]}`);
      expect(new Set(keys).size).toBe(keys.length);
      const countrySlugs = COUNTRIES.map((c) => c.slug[locale]);
      expect(new Set(countrySlugs).size).toBe(countrySlugs.length);
    }
  });

  it("resolves every place by its own slugs", () => {
    for (const locale of LOCALES) {
      for (const place of PLACES) {
        const country = getCountry(place.cc)!;
        expect(getPlaceBySlug(locale, country.slug[locale], place.slug[locale])?.place.id).toBe(place.id);
      }
    }
  });

  it("has a full year of climate normals for every place", () => {
    // Nearby-city links on climate pages assume this.
    expect(PLACES.filter((p) => !getClimate(p.id)).map((p) => p.en)).toEqual([]);
  });

  it("finds every hand-picked popular city", () => {
    for (const locale of LOCALES) {
      expect(popularPlaces(locale)).toHaveLength(POPULAR[locale].length);
    }
  });
});

describe("country hubs", () => {
  it("indexes hubs with several cities only", () => {
    expect(isCountryHubIndexed("CZ")).toBe(true);
    expect(isCountryHubIndexed("HU")).toBe(false);
  });
});

describe("placeLabels", () => {
  it("names and links the place in every language", () => {
    const prague = PLACES.find((p) => p.cc === "CZ" && p.slug.en === "prague")!;
    expect(placeLabels(prague, getCountry("CZ")!)).toEqual({
      en: { name: "Prague", countryName: "Czechia", path: "/weather/czechia/prague" },
      cs: { name: "Praha", countryName: "Česko", path: "/cs/pocasi/cesko/praha" },
    });
  });
});
