import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n";
import type { DayBrief, MonthProse, RangeProse } from "@/i18n/en";
import { vocalizesV } from "@/i18n/cs";

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

describe("Czech preposition v/ve", () => {
  it.each([
    [1, false], [2, true], [4, true], [5, false], [12, true], [15, false], [20, true], [21, true],
    [49, true], [50, false], [95, false], [100, true], [117, true], [499, true], [500, false],
    [1000, false], [1500, false], [2000, true], [12_000, true], [100_000, true], [1_000_000, false],
  ])("%i → ve: %s", (n, expected) => {
    expect(vocalizesV(n)).toBe(expected);
  });

  it("follows how numbers and clock times are read", () => {
    expect(cs.world.lead(440, 117)).toContain("ve 117 zemích");
    expect(cs.world.lead(440, 95)).toContain("v 95 zemích");
    expect(cs.prose.sun("Praha", "4:55", "21:10", "16 h 15 min", null)).toContain("vychází ve 4:55 a zapadá ve 21:10");
    expect(cs.prose.sun("Praha", "7:12", "16:21", "9 h 9 min", null)).toContain("vychází v 7:12 a zapadá v 16:21");
    expect(cs.prose.tomorrow("Praha", day, { rise: "3:58", set: "20:13" })).toContain("vychází ve 3:58 a zapadá ve 20:13");
  });
});

describe("climate month prose", () => {
  const month: MonthProse = {
    name: "Tromsø",
    month: 11,
    hi: 1,
    lo: -4,
    p: 106,
    pd: 15,
    daylight: "0 min",
    polar: "night",
    prevHi: 3,
    prevMonth: 10,
    verdict: "poor",
    annualRank: 11,
  };

  it("describes polar night instead of a 0-minute day", () => {
    expect(en.prose.month(month)).toContain("polar night");
    expect(en.prose.month(month)).not.toContain("0 min");
    expect(cs.prose.month(month)).toContain("polární noc");
    expect(cs.prose.month(month)).not.toContain("0 min");
    expect(cs.prose.month({ ...month, month: 5, polar: "day", daylight: "24 h" })).toContain("polární den");
  });

  it("writes negative temperatures with a minus sign and leaves no trailing space", () => {
    expect(cs.prose.month(month)).toContain("\u22124 °C");
    expect(en.prose.month(month)).toContain("\u22124 °C (25 °F)");
    expect(cs.prose.month(month)).toBe(cs.prose.month(month).trim());
  });
});

