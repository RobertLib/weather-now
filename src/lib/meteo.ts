/** Dew point in °C via the Magnus-Tetens approximation. */
export function dewPoint(tempC: number, humidity: number): number {
  const h = Math.min(100, Math.max(1, humidity));
  const a = 17.625;
  const b = 243.04;
  const alpha = Math.log(h / 100) + (a * tempC) / (b + tempC);
  return (b * alpha) / (a - alpha);
}

/** 0 very dry … 5 oppressive; labels live in the dictionaries. */
export function dewComfortLevel(dp: number): number {
  if (dp < 0) return 0;
  if (dp < 10) return 1;
  if (dp < 16) return 2;
  if (dp < 19) return 3;
  if (dp < 22) return 4;
  return 5;
}

export type PressureTrend = "rising" | "falling" | "steady";

/** Sea-level pressure tendency over the next few hours. */
export function pressureTrend(now: number, later: number | undefined): PressureTrend {
  if (later === undefined) return "steady";
  const delta = later - now;
  if (delta > 1.5) return "rising";
  if (delta < -1.5) return "falling";
  return "steady";
}

/** WHO UV index bands: 0 low, 1 moderate, 2 high, 3 very high, 4 extreme. */
export function uvLevel(uv: number): number {
  if (uv < 3) return 0;
  if (uv < 6) return 1;
  if (uv < 8) return 2;
  if (uv < 11) return 3;
  return 4;
}

export const UV_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"];
