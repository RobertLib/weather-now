import { describe, expect, it } from "vitest";
import { isThreeHourSlot, normalizeForecast, slimForecast } from "@/lib/openmeteo";
import { hourOfDay } from "@/lib/datetime";
import type { CurrentConditions, Forecast, HourlyPoint } from "@/types/weather";

type RawForecast = Parameters<typeof normalizeForecast>[0];
const DAY = 86_400;

/** A response series where every variable not given is all nulls. */
function series(values: Record<string, unknown[]>, length: number): unknown {
  return new Proxy(values, {
    get: (target, key) => (typeof key === "string" && key in target ? target[key] : Array(length).fill(null)),
    has: () => true,
  });
}

const current: CurrentConditions = {
  time: 0,
  temp: 20,
  feelsLike: 20,
  humidity: 50,
  pressure: 1013,
  windSpeed: 2,
  windGust: null,
  windDir: 0,
  clouds: 0,
  precipitation: 0,
  code: 0,
  isDay: true,
};

function hour(time: number): HourlyPoint {
  return {
    time,
    temp: 20,
    feelsLike: 20,
    humidity: 50,
    pop: 0,
    precipitation: 0,
    code: 0,
    clouds: 0,
    pressure: 1013,
    windSpeed: 2,
    windGust: null,
    windDir: 0,
    visibility: null,
    uv: null,
    isDay: true,
  };
}

describe("isThreeHourSlot", () => {
  it("uses the location's clock, not UTC", () => {
    // 00:00 in Prague (CET) is 23:00 UTC; 01:00 in Prague is 00:00 UTC.
    expect(isThreeHourSlot(Date.UTC(2026, 10, 11, 23) / 1000, "Europe/Prague")).toBe(true);
    expect(isThreeHourSlot(Date.UTC(2026, 10, 12, 0) / 1000, "Europe/Prague")).toBe(false);
  });

  it("works in half-hour time zones", () => {
    // 03:00 in Kolkata (UTC+5:30) is 21:30 UTC — never a multiple of 3 h in unix time.
    expect(isThreeHourSlot(Date.UTC(2026, 10, 11, 21, 30) / 1000, "Asia/Kolkata")).toBe(true);
    expect(isThreeHourSlot(Date.UTC(2026, 10, 11, 22, 30) / 1000, "Asia/Kolkata")).toBe(false);
  });
});

describe("slimForecast", () => {
  it("keeps local three-hourly slots beyond two days in half-hour zones", () => {
    const tz = "Asia/Kolkata";
    const midnight = Date.UTC(2026, 10, 11, 18, 30) / 1000; // 00:00 IST, Nov 12
    const forecast: Forecast = {
      lat: 19.08,
      lon: 72.88,
      elevation: 10,
      timezone: tz,
      fetchedAt: midnight * 1000,
      current,
      hourly: Array.from({ length: 16 * 24 }, (_, i) => hour(midnight + i * 3600)),
      daily: [],
    };
    const now = (midnight + 10 * 3600) * 1000;
    const slim = slimForecast(forecast, now);
    const denseEnd = now / 1000 - 3600 + 49 * 3600;
    const sparse = slim.hourly.filter((h) => h.time >= denseEnd);

    expect(sparse.length).toBeGreaterThan(80);
    expect(sparse.every((h) => hourOfDay(h.time, tz) % 3 === 0)).toBe(true);
    // Every hour of the next two days stays.
    expect(slim.hourly.filter((h) => h.time < denseEnd)).toHaveLength(49);
  });
});

describe("normalizeForecast", () => {
  it("drops sunrise and sunset during polar night and polar day", () => {
    const tz = "Europe/Oslo";
    const t0 = Date.UTC(2026, 11, 20) / 1000 - 3600; // local midnight (UTC+1)
    const raw = {
      latitude: 69.65,
      longitude: 18.96,
      elevation: 10,
      timezone: tz,
      current: { time: t0 },
      hourly: series({ time: [] }, 0),
      daily: series(
        {
          time: [t0, t0 + DAY, t0 + 2 * DAY],
          temperature_2m_max: [-2, -2, -2],
          temperature_2m_min: [-6, -6, -6],
          // Open-Meteo's polar night (sunrise = sunset = midnight) and polar
          // day (midnight to midnight), then an ordinary day.
          sunrise: [t0, t0 + DAY, t0 + 2 * DAY + 9 * 3600],
          sunset: [t0, t0 + 2 * DAY, t0 + 2 * DAY + 15 * 3600],
          daylight_duration: [0, DAY, 6 * 3600],
        },
        3
      ),
    } as unknown as RawForecast;

    const { daily } = normalizeForecast(raw, 0);
    expect(daily.map((d) => [d.sunrise, d.sunset, d.daylight])).toEqual([
      [null, null, 0],
      [null, null, DAY],
      [t0 + 2 * DAY + 9 * 3600, t0 + 2 * DAY + 15 * 3600, 6 * 3600],
    ]);
  });

  it("keeps a missing precipitation probability unknown instead of 0 %", () => {
    // Open-Meteo leaves the last ~1.5 days of hourly probabilities empty.
    const raw = {
      latitude: 0,
      longitude: 0,
      elevation: 0,
      timezone: "UTC",
      current: { time: 0 },
      hourly: series({ time: [0, 3600, 7200], precipitation_probability: [40, 0, null] }, 3),
      daily: series({ time: [] }, 0),
    } as unknown as RawForecast;

    expect(normalizeForecast(raw, 0).hourly.map((h) => h.pop)).toEqual([0.4, 0, null]);
  });
});
