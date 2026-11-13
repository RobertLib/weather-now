import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import {
  COUNTRIES,
  PLACES,
  getCountry,
  getPlaceBySlug,
  isCountryHubIndexed,
  placeLabels,
  placeRegion,
  popularPlaces,
} from "@/lib/places";
import { POPULAR } from "@/lib/popular";
import { getClimate, isClimateIndexed } from "@/lib/climate";
import { SLUG_PATTERN } from "../../scripts/lib/slugs.mjs";

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

  it("only uses URL-safe slugs", () => {
    for (const locale of LOCALES) {
      expect(PLACES.map((p) => p.slug[locale]).filter((s) => !SLUG_PATTERN.test(s))).toEqual([]);
      expect(COUNTRIES.map((c) => c.slug[locale]).filter((s) => !SLUG_PATTERN.test(s))).toEqual([]);
    }
  });

  it("has a valid IANA time zone and a real elevation for every place", () => {
    const badZone = PLACES.filter((p) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: p.tz });
        return false;
      } catch {
        return true;
      }
    });
    expect(badZone.map((p) => p.en)).toEqual([]);
    expect(PLACES.filter((p) => !Number.isFinite(p.ele)).map((p) => p.en)).toEqual([]);
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

  it("has plausible climate normals", () => {
    const problems: string[] = [];
    for (const place of PLACES) {
      const months = getClimate(place.id)!;
      months.forEach((m, i) => {
        if (!(m.hi > m.lo)) problems.push(`${place.en} ${i + 1}: high ${m.hi} ≤ low ${m.lo}`);
        if (m.hi > 50 || m.lo < -60) problems.push(`${place.en} ${i + 1}: ${m.hi}/${m.lo} °C`);
        if (m.p < 0 || m.p > 1500) problems.push(`${place.en} ${i + 1}: ${m.p} mm`);
        if (m.pd !== undefined && (m.pd < 0 || m.pd > 31)) problems.push(`${place.en} ${i + 1}: ${m.pd} wet days`);
        if (m.sun !== undefined && (m.sun < 0 || m.sun > 16)) problems.push(`${place.en} ${i + 1}: ${m.sun} h sun`);
      });
      // A coarse grid cell that is mostly sea squeezes the day/night range
      // (Punta Cana once had 26/25 °C all year); real land climates don't.
      const range = months.reduce((sum, m) => sum + (m.hi - m.lo), 0) / 12;
      if (range < 3) problems.push(`${place.en}: mean daily range only ${range.toFixed(1)} °C`);
    }
    expect(problems).toEqual([]);
  });

  it("indexes the climate pages of the biggest place per climate source", () => {
    expect(isClimateIndexed(PLACES.find((p) => p.cc === "CZ" && p.slug.en === "prague")!.id)).toBe(true);
  });

  it("noindexes a climate page only when a bigger place shows the same numbers", () => {
    const shown = (id: number) =>
      JSON.stringify(getClimate(id)!.map((m) => [Math.round(m.hi), Math.round(m.lo), Math.round(m.p)]));
    const orphans = PLACES.flatMap((place, i) => {
      if (isClimateIndexed(place.id)) return [];
      const twin = PLACES.slice(0, i).find((p) => isClimateIndexed(p.id) && shown(p.id) === shown(place.id));
      return twin ? [] : [place.en];
    });
    expect(orphans).toEqual([]);
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

describe("placeRegion", () => {
  it("leaves out a region that only repeats the city name", () => {
    const prague = PLACES.find((p) => p.cc === "CZ" && p.slug.en === "prague")!;
    expect(placeRegion(prague, "en")).toBeUndefined();
    expect(placeRegion(prague, "cs")).toBe("Hlavní město Praha");
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
