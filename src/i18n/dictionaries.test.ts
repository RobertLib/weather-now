import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n";
import type { DayBrief, RangeProse } from "@/i18n/en";

const en = getDictionary("en");
const cs = getDictionary("cs");

const day: DayBrief = { cond: "Clear sky", hi: 5, lo: -3, pop: 0.1, precip: 0, windMax: 3, uvMax: 1, label: "Friday, Nov 13" };

const range: RangeProse = {
  name: "Prague",
  days: 14,
  hiMin: 3,
  hiMax: 11,
  warmestLabel: "Monday, Nov 16",
  warmestHi: 11,
  coldestLabel: "Friday, Nov 20",
  coldestLo: -4,
  wettestLabel: "Tuesday, Nov 17",
  wettestPrecip: 6.4,
  wetDays: 3,
  trend: -3,
};

describe("country copy", () => {
  it("doesn't say '1 places' for single-city countries", () => {
    expect(en.country.description("Hungary", 1, "Budapest")).not.toMatch(/\b1 places\b/);
    expect(en.country.lead("Hungary", 1)).not.toMatch(/\b1 places\b/);
    expect(en.country.description("Czechia", 25, "Prague")).toContain("25 places");
  });

  it("declines Czech counts", () => {
    expect(cs.country.lead("Česko", 3)).toContain("3 místa");
    expect(cs.country.lead("Česko", 25)).toContain("25 míst");
    expect(cs.world.cities(1)).toBe("1 město");
  });
});

describe("tomorrow prose", () => {
  it("mentions sunrise and sunset on ordinary days", () => {
    expect(en.prose.tomorrow("Prague", day, { rise: "7:01 AM", set: "4:17 PM" })).toContain("rises at 7:01 AM");
  });

  it("describes polar night instead of a 0:00 sunrise", () => {
    const text = en.prose.tomorrow("Tromsø", day, { polar: "night" });
    expect(text).toContain("polar night");
    expect(text).not.toContain("rises at");
    expect(cs.prose.tomorrow("Tromsø", day, { polar: "day" })).toContain("polární den");
  });
});

describe("14-day FAQ", () => {
  it.each([
    ["en", en],
    ["cs", cs],
  ] as const)("has its own questions in %s", (_, t) => {
    const items = t.faq.range(range);
    expect(items).toHaveLength(4);
    expect(items[0][1]).toContain("Tuesday, Nov 17");
  });
});
