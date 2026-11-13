import { DailyPoint, Forecast, HourlyPoint } from "@/types/weather";
import { upcomingDays, upcomingHours } from "@/lib/openmeteo";

/**
 * Language-neutral facts distilled from a forecast. The dictionaries turn
 * these into sentences, so English and Czech pages always agree on numbers.
 */

export interface NowFacts {
  temp: number;
  feelsLike: number;
  code: number;
  time: number;
  windSpeed: number;
  humidity: number;
}

export interface RainWindow {
  /** Highest hourly chance within the window, 0-1. */
  maxPop: number;
  /** Hour with the highest chance. */
  peakTime: number | null;
  total: number;
}

export interface OverviewFacts {
  now: NowFacts;
  today: DailyPoint | null;
  tomorrow: DailyPoint | null;
  rainNext24: RainWindow;
  week: WeekFacts | null;
}

export interface WeekFacts {
  days: number;
  hiMin: number;
  hiMax: number;
  warmest: DailyPoint;
  coldest: DailyPoint;
  wettest: DailyPoint;
  /** Days with at least 1 mm. */
  wetDays: number;
  /** Trend of daily highs between the first and last three days, °C. */
  trend: number;
}

export function rainWindow(hours: HourlyPoint[]): RainWindow {
  let maxPop = 0;
  let peakTime: number | null = null;
  let total = 0;
  for (const h of hours) {
    total += h.precipitation;
    if (h.pop !== null && h.pop > maxPop) {
      maxPop = h.pop;
      peakTime = h.time;
    }
  }
  return { maxPop, peakTime, total };
}

export function weekFacts(days: DailyPoint[]): WeekFacts | null {
  if (days.length < 3) return null;
  const by = (pick: (d: DailyPoint) => number, dir: 1 | -1) =>
    days.reduce((best, d) => (pick(d) * dir > pick(best) * dir ? d : best));
  const avg = (list: DailyPoint[]) =>
    list.reduce((sum, d) => sum + d.tempMax, 0) / list.length;

  return {
    days: days.length,
    hiMin: Math.min(...days.map((d) => d.tempMax)),
    hiMax: Math.max(...days.map((d) => d.tempMax)),
    warmest: by((d) => d.tempMax, 1),
    coldest: by((d) => d.tempMin, -1),
    wettest: by((d) => d.precipitation, 1),
    wetDays: days.filter((d) => d.precipitation >= 1).length,
    trend: avg(days.slice(-3)) - avg(days.slice(0, 3)),
  };
}

export function overviewFacts(forecast: Forecast, now = Date.now()): OverviewFacts {
  const days = upcomingDays(forecast, now);
  const c = forecast.current;
  return {
    now: {
      temp: c.temp,
      feelsLike: c.feelsLike,
      code: c.code,
      time: c.time,
      windSpeed: c.windSpeed,
      humidity: c.humidity,
    },
    today: days[0] ?? null,
    tomorrow: days[1] ?? null,
    rainNext24: rainWindow(upcomingHours(forecast, 24, now)),
    week: weekFacts(days.slice(0, 7)),
  };
}
