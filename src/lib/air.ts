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
}

const ROWS: Array<[keyof Pollutants, string, number]> = [
  ["pm2_5", "PM2.5", 75],
  ["pm10", "PM10", 150],
  ["o3", "O₃", 380],
  ["no2", "NO₂", 340],
  ["so2", "SO₂", 750],
  ["co", "CO", 15000],
];

export function pollutantReadings(p: Pollutants): PollutantReading[] {
  return ROWS.flatMap(([key, label, ceiling]) => {
    const value = p[key];
    return value === null ? [] : [{ key, label, value, ratio: Math.min(1, value / ceiling) }];
  });
}

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
