import { describe, expect, it } from "vitest";
import en from "@/i18n/en";
import { buildInsights } from "@/lib/insights";
import { formatSpeed, formatTemp, formatTempDelta, UnitSystem } from "@/lib/units";
import type { CurrentConditions, HourlyPoint } from "@/types/weather";

const current: CurrentConditions = {
  time: 0,
  temp: 15,
  feelsLike: 15,
  humidity: 60,
  pressure: 1013,
  windSpeed: 8,
  // 50.4 km/h ≈ 31 mph
  windGust: 14,
  windDir: 270,
  clouds: 50,
  precipitation: 0,
  code: 2,
  isDay: true,
};

/**
 * 24 dry hours swinging between 10 and 20 °C, all at night (22:00–06:00 UTC)
 * so no "best hour" tip takes one of the four slots.
 */
const hourly: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: (((22 + (i % 9)) % 24) + Math.floor(i / 9) * 24) * 3600,
  temp: i === 12 ? 20 : 10,
  feelsLike: 10,
  humidity: 60,
  pop: 0,
  precipitation: 0,
  code: 2,
  clouds: 50,
  pressure: 1013,
  windSpeed: 3,
  windGust: null,
  windDir: 270,
  visibility: null,
  uv: null,
  isDay: true,
}));

const insights = (units: UnitSystem) =>
  buildInsights(en, current, hourly, undefined, "UTC", {
    hour: () => "noon",
    temp: (c) => formatTemp(c, units),
    tempDelta: (c) => formatTempDelta(c, units),
    speed: (ms) => formatSpeed(ms, units),
  });

describe("buildInsights", () => {
  it("shows gusts and the temperature swing in metric units", () => {
    const text = insights("metric").map((i) => i.text).join(" ");
    expect(text).toContain("50 km/h");
    expect(text).toContain("About 10° between");
  });

  it("converts gusts and the swing (a difference, not a temperature) to imperial", () => {
    const text = insights("imperial").map((i) => i.text).join(" ");
    expect(text).toContain("31 mph");
    expect(text).toContain("About 18° between");
    expect(text).not.toContain("km/h");
  });
});
