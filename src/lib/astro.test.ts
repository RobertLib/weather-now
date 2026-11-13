import { describe, expect, it } from "vitest";
import { daylightInfo, localNoonUtc, solstice, sunTimes } from "@/lib/astro";

const at = (iso: string) => Date.parse(iso) / 1000;

describe("sunTimes", () => {
  it("matches published times for Prague at the June solstice (±5 min)", () => {
    // Prague, 21 June 2026: sunrise 04:52 CEST, sunset 21:15 CEST.
    const s = sunTimes(localNoonUtc("2026-06-21", 14.42), 50.08, 14.42);
    expect(Math.abs(s.sunrise! - at("2026-06-21T02:52:00Z"))).toBeLessThan(300);
    expect(Math.abs(s.sunset! - at("2026-06-21T19:15:00Z"))).toBeLessThan(300);
  });

  it("reports polar night and midnight sun in Tromsø", () => {
    const winter = sunTimes(localNoonUtc("2026-12-21", 18.96), 69.65, 18.96);
    expect(winter).toMatchObject({ sunrise: null, sunset: null, daylight: 0 });
    const summer = sunTimes(localNoonUtc("2026-06-21", 18.96), 69.65, 18.96);
    expect(summer).toMatchObject({ sunrise: null, sunset: null, daylight: 1440 });
  });
});

describe("solstice", () => {
  it.each([
    [2024, "june", "2024-06-20T20:51:00Z"],
    [2024, "december", "2024-12-21T09:20:00Z"],
    [2025, "june", "2025-06-21T02:42:00Z"],
    [2025, "december", "2025-12-21T15:03:00Z"],
  ] as const)("finds the %s %s solstice (±15 min)", (year, which, iso) => {
    expect(Math.abs(solstice(year, which) - at(iso))).toBeLessThan(15 * 60);
  });

  it("isn't always on the 21st", () => {
    expect(new Date(solstice(2024, "june") * 1000).getUTCDate()).toBe(20);
    expect(new Date(solstice(2027, "december") * 1000).getUTCDate()).toBe(22);
  });
});

describe("daylightInfo", () => {
  const sunrise = at("2026-11-12T06:00:00Z");
  const sunset = at("2026-11-12T16:00:00Z");

  it("counts down to sunset during the day", () => {
    const info = daylightInfo(at("2026-11-12T15:00:00Z"), { sunrise, sunset, daylight: 36_000 });
    expect(info).toMatchObject({ isDay: true, nextEvent: "sunset", minutesToNextEvent: 60, polar: null });
    expect(info.progress).toBeCloseTo(0.9);
  });

  it("counts down to the next sunrise after dark", () => {
    const info = daylightInfo(at("2026-11-12T20:00:00Z"), { sunrise, sunset, daylight: 36_000 });
    expect(info).toMatchObject({ isDay: false, nextEvent: "sunrise", minutesToNextEvent: 600 });
  });

  it("has no next event during polar night or polar day", () => {
    expect(daylightInfo(0, { sunrise: null, sunset: null, daylight: 0 })).toMatchObject({
      polar: "night",
      isDay: false,
      nextEvent: null,
      minutesToNextEvent: null,
      lengthMinutes: 0,
    });
    expect(daylightInfo(0, { sunrise: null, sunset: null, daylight: 86_400 })).toMatchObject({
      polar: "day",
      isDay: true,
      nextEvent: null,
      lengthMinutes: 1440,
    });
  });
});
