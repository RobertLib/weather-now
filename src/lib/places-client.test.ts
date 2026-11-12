import { describe, expect, it } from "vitest";
import { localizePlace } from "@/lib/places-client";

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
