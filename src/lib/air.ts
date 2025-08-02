import { AirQuality } from "@/types/weather";

export interface AqiInfo {
  index: number;
  label: string;
  /** Tailwind-friendly colour used for badges and the gauge. */
  color: string;
  advice: string;
}

const LEVELS: Record<number, Omit<AqiInfo, "index">> = {
  1: {
    label: "Good",
    color: "#22c55e",
    advice: "Air quality is ideal — enjoy being outside.",
  },
  2: {
    label: "Fair",
    color: "#84cc16",
    advice: "Acceptable air quality for most people.",
  },
  3: {
    label: "Moderate",
    color: "#f59e0b",
    advice: "Sensitive groups may want to limit long outdoor efforts.",
  },
  4: {
    label: "Poor",
    color: "#f97316",
    advice: "Consider shortening intense outdoor activity.",
  },
  5: {
    label: "Very poor",
    color: "#ef4444",
    advice: "Stay indoors where you can and keep windows closed.",
  },
};

export function aqiInfo(index: number): AqiInfo {
  const level = LEVELS[index] ?? LEVELS[3];
  return { index, ...level };
}

export interface PollutantReading {
  key: string;
  label: string;
  value: number;
  unit: string;
  /** Share of a "high" reference level, 0-1, for the mini bars. */
  ratio: number;
}

/** Reference ceilings roughly matching the top of OpenWeather's scale. */
const CEILINGS: Record<string, number> = {
  pm2_5: 75,
  pm10: 200,
  o3: 180,
  no2: 200,
  so2: 350,
  co: 15000,
};

export function pollutants(air: AirQuality): PollutantReading[] {
  const c = air.list[0]?.components;
  if (!c) return [];

  const rows: Array<[string, string, number, string]> = [
    ["pm2_5", "PM2.5", c.pm2_5, "µg/m³"],
    ["pm10", "PM10", c.pm10, "µg/m³"],
    ["o3", "Ozone", c.o3, "µg/m³"],
    ["no2", "NO₂", c.no2, "µg/m³"],
    ["so2", "SO₂", c.so2, "µg/m³"],
    ["co", "CO", c.co, "µg/m³"],
  ];

  return rows.map(([key, label, value, unit]) => ({
    key,
    label,
    value,
    unit,
    ratio: Math.min(1, value / (CEILINGS[key] ?? 100)),
  }));
}
