import { PollenType, Pollutants } from "@/types/weather";

/**
 * European Air Quality Index bands (EEA): 0-20 good, 20-40 fair, 40-60
 * moderate, 60-80 poor, 80-100 very poor, above that extremely poor.
 */
export const AQI_COLORS = ["#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444", "#9333ea"];

export function aqiLevel(index: number): number {
  if (index < 20) return 0;
  if (index < 40) return 1;
  if (index < 60) return 2;
  if (index < 80) return 3;
  if (index <= 100) return 4;
  return 5;
}

export interface PollutantReading {
  key: keyof Pollutants;
  label: string;
  value: number;
  /** Share of the EEA "very poor" threshold, 0-1, for the mini bars. */
  ratio: number;
  /**
   * The pollutant's own EAQI band (0 good … 5 extremely poor), or null for
   * carbon monoxide, which the European index doesn't cover.
   */
  level: number | null;
}

/**
 * Upper limits (µg/m³) of the good, fair, moderate, poor and very poor bands of
 * the European AQI sub-indices, as used by Open-Meteo's `european_aqi`. The
 * index itself uses 24-hour means for particulates, so a level derived from
 * the current hourly value is an approximation.
 */
const BANDS: Record<Exclude<keyof Pollutants, "co">, [number, number, number, number, number]> = {
  pm2_5: [10, 20, 25, 50, 75],
  pm10: [20, 40, 50, 100, 150],
  no2: [40, 90, 120, 230, 340],
  o3: [50, 100, 130, 240, 380],
  so2: [100, 200, 350, 500, 750],
};

const ROWS: Array<[keyof Pollutants, string]> = [
  ["pm2_5", "PM2.5"],
  ["pm10", "PM10"],
  ["o3", "O₃"],
  ["no2", "NO₂"],
  ["so2", "SO₂"],
  ["co", "CO"],
];

/** Bar scale for CO, which has no EAQI band. */
const CO_CEILING = 15000;

export function pollutantLevel(key: keyof Pollutants, value: number): number | null {
  if (key === "co") return null;
  const index = BANDS[key].findIndex((upper) => value <= upper);
  return index < 0 ? 5 : index;
}

export function pollutantReadings(p: Pollutants): PollutantReading[] {
  return ROWS.flatMap(([key, label]) => {
    const value = p[key];
    if (value === null) return [];
    const ceiling = key === "co" ? CO_CEILING : BANDS[key][4];
    return [{ key, label, value, ratio: Math.min(1, value / ceiling), level: pollutantLevel(key, value) }];
  });
}

/** Neutral colour for readings without a band. */
export const UNRATED_COLOR = "#94a3b8";

/** Grains/m³ where each pollen type turns low → moderate → high → very high. */
const POLLEN_STEPS: Record<PollenType, [number, number, number]> = {
  alder: [10, 50, 100],
  birch: [10, 50, 100],
  grass: [5, 20, 50],
  mugwort: [5, 15, 50],
  olive: [10, 50, 200],
  ragweed: [5, 15, 50],
};

/** 0 none, 1 low, 2 moderate, 3 high, 4 very high. */
export function pollenLevel(type: PollenType, value: number): number {
  if (value < 1) return 0;
  const [moderate, high, veryHigh] = POLLEN_STEPS[type];
  if (value < moderate) return 1;
  if (value < high) return 2;
  if (value < veryHigh) return 3;
  return 4;
}

export const POLLEN_COLORS = ["#94a3b8", "#22c55e", "#eab308", "#f97316", "#ef4444"];
