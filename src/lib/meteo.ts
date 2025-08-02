/** Dew point in °C via the Magnus-Tetens approximation. */
export function dewPoint(tempC: number, humidity: number): number {
  const h = Math.min(100, Math.max(1, humidity));
  const a = 17.625;
  const b = 243.04;
  const alpha = Math.log(h / 100) + (a * tempC) / (b + tempC);
  return (b * alpha) / (a - alpha);
}

/** How the dew point reads to a person. */
export function dewPointComfort(dp: number): string {
  if (dp < 0) return "Very dry";
  if (dp < 10) return "Comfortable";
  if (dp < 16) return "Pleasant";
  if (dp < 19) return "Slightly humid";
  if (dp < 22) return "Humid";
  return "Oppressive";
}

/** Sea-level pressure trend label from the 3-hourly forecast pressures. */
export function pressureTrend(now: number, laterValues: number[]): {
  label: string;
  direction: "rising" | "falling" | "steady";
} {
  if (!laterValues.length) return { label: "Steady", direction: "steady" };
  const delta = laterValues[0] - now;
  if (delta > 1.5) return { label: "Rising", direction: "rising" };
  if (delta < -1.5) return { label: "Falling", direction: "falling" };
  return { label: "Steady", direction: "steady" };
}

/** Rough sun-strength proxy (0-10) — no UV data on the free API tier. */
export function sunStrength(
  cloudCoverPercent: number,
  daylightProgress: number,
  isDay: boolean
): number {
  if (!isDay) return 0;
  // Peaks at solar noon (progress 0.5).
  const elevation = Math.sin(Math.PI * Math.min(1, Math.max(0, daylightProgress)));
  const clouds = 1 - (cloudCoverPercent / 100) * 0.75;
  return Math.round(elevation * clouds * 10 * 10) / 10;
}
