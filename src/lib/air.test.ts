import { describe, expect, it } from "vitest";
import { aqiLevel, pollutantLevel, pollutantReadings } from "@/lib/air";

describe("pollutant levels", () => {
  it("follows the EAQI bands of each pollutant", () => {
    expect(pollutantLevel("pm2_5", 5)).toBe(0);
    expect(pollutantLevel("pm2_5", 22)).toBe(2);
    expect(pollutantLevel("pm2_5", 80)).toBe(5);
    expect(pollutantLevel("o3", 39)).toBe(0);
    expect(pollutantLevel("no2", 100)).toBe(2);
    expect(pollutantLevel("so2", 600)).toBe(4);
  });

  it("leaves carbon monoxide unrated", () => {
    expect(pollutantLevel("co", 314)).toBeNull();
  });

  it("rates each reading on its own, not by the overall index", () => {
    const readings = pollutantReadings({ pm2_5: 60, pm10: 17, o3: 39, no2: 19, so2: 5, co: 314 });
    const byKey = Object.fromEntries(readings.map((r) => [r.key, r.level]));
    expect(byKey).toEqual({ pm2_5: 4, pm10: 0, o3: 0, no2: 0, so2: 0, co: null });
    expect(readings.find((r) => r.key === "pm2_5")?.ratio).toBeCloseTo(0.8);
  });

  it("uses the same 20-point bands as the overall index", () => {
    expect([0, 19.9, 20, 59, 79, 100, 101].map(aqiLevel)).toEqual([0, 0, 1, 2, 3, 4, 5]);
  });
});
