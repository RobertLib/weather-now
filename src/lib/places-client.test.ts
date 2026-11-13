import { describe, expect, it } from "vitest";
import { IndexPlace, PlaceIndex, localizePlace, matchPlaces, normalize } from "@/lib/places-client";
import { fold } from "../../scripts/lib/slugs.mjs";

const saved = {
  id: "50.08,14.42",
  name: "Praha",
  countryName: "Česko",
  cc: "CZ",
  lat: 50.08,
  lon: 14.42,
  path: "/cs/pocasi/cesko/praha",
  i18n: {
    en: { name: "Prague", countryName: "Czechia", path: "/weather/czechia/prague" },
    cs: { name: "Praha", countryName: "Česko", path: "/cs/pocasi/cesko/praha" },
  },
};

describe("localizePlace", () => {
  it("shows a place saved on the Czech site in English", () => {
    expect(localizePlace(saved, "en")).toMatchObject({
      name: "Prague",
      countryName: "Czechia",
      path: "/weather/czechia/prague",
      lat: 50.08,
    });
  });

  it("keeps places saved before labels were stored as they are", () => {
    const legacy = { name: "Praha", cc: "CZ", lat: 50.08, lon: 14.42, path: "/cs/pocasi/cesko/praha" };
    expect(localizePlace(legacy, "en")).toBe(legacy);
  });
});

describe("matchPlaces", () => {
  const index: PlaceIndex = {
    countries: { PL: ["Poland", "Polsko", "poland", "polsko"], NO: ["Norway", "Norsko", "norway", "norsko"] },
    places: [
      [1, "PL", "Wrocław", "Vratislav", "wroclaw", "vratislav", 51.1, 17.03],
      [2, "NO", "Tromsø", "Tromsø", "tromso", "tromso", 69.65, 18.96],
    ] satisfies IndexPlace[],
  };

  it("finds names with letters that have no combining accent", () => {
    expect(matchPlaces(index, "wroclaw").map((p) => p[0])).toEqual([1]);
    expect(matchPlaces(index, "Tromso").map((p) => p[0])).toEqual([2]);
    expect(matchPlaces(index, "vratis").map((p) => p[0])).toEqual([1]);
  });

  it("folds exactly like the slug generator", () => {
    for (const name of ["Wrocław", "Tromsø", "Straße", "Þingvellir", "České Budějovice", "ǅakovo"]) {
      expect(normalize(name)).toBe(fold(name));
    }
  });
});
