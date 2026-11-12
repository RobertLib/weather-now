import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { CITY_VIEWS, countryPath, parseCityView, placePath } from "@/lib/routes";

const country = { slug: { en: "czechia", cs: "cesko" } };
const place = { slug: { en: "prague", cs: "praha" } };

/** The `[[...view]]` segments of a city URL. */
function viewSegments(path: string, locale: (typeof LOCALES)[number]): string[] {
  const base = `${countryPath(locale, country)}/${place.slug[locale]}`;
  return path.slice(base.length).split("/").filter(Boolean);
}

describe("city routes", () => {
  it.each(LOCALES)("round-trips every view in %s", (locale) => {
    for (const view of CITY_VIEWS) {
      const path = placePath(locale, country, place, view);
      expect(parseCityView(locale, viewSegments(path, locale))).toEqual({ view });
    }
    for (let month = 0; month < 12; month++) {
      const path = placePath(locale, country, place, "climate", month);
      expect(parseCityView(locale, viewSegments(path, locale))).toEqual({ view: "climate", month });
    }
  });

  it("builds the documented URLs", () => {
    expect(placePath("en", country, place)).toBe("/weather/czechia/prague");
    expect(placePath("cs", country, place, "14-day")).toBe("/cs/pocasi/cesko/praha/14-dni");
    expect(placePath("en", country, place, "climate", 10)).toBe("/weather/czechia/prague/climate/november");
  });

  it("rejects segments from the other language and malformed paths", () => {
    expect(parseCityView("en", ["zitra"])).toBeNull();
    expect(parseCityView("cs", ["podnebi", "january"])).toBeNull();
    expect(parseCityView("en", ["tomorrow", "extra"])).toBeNull();
    expect(parseCityView("en", ["climate", "november", "extra"])).toBeNull();
  });
});
