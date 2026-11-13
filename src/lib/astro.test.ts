import { describe, expect, it } from "vitest";
import { daylightInfo, localNoonUtc, solstice, sunTimes } from "@/lib/astro";

const at = (iso: string) => Date.parse(iso) / 1000;

describe("sunTimes", () => {
  // Reference times from the NOAA solar calculator (which Open-Meteo agrees with).
  it.each([
    ["Prague, June solstice", "2026-06-21", 50.088, 14.4208, "2026-06-21T02:52:30Z", "2026-06-21T19:15:44Z"],
    ["Prague, November", "2026-11-13", 50.088, 14.4208, "2026-11-13T06:11:54Z", "2026-11-13T15:20:37Z"],
    ["Sydney, November", "2026-11-13", -33.87, 151.21, "2026-11-12T18:45:03Z", "2026-11-13T08:34:05Z"],
    ["New York, November", "2026-11-13", 40.71, -74.01, "2026-11-13T11:40:32Z", "2026-11-13T21:39:38Z"],
  ] as const)("matches NOAA within a minute: %s", (_, date, lat, lon, rise, set) => {
    const s = sunTimes(localNoonUtc(date, lon), lat, lon);
    expect(Math.abs(s.sunrise! - at(rise))).toBeLessThan(60);
    expect(Math.abs(s.sunset! - at(set))).toBeLessThan(60);
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
