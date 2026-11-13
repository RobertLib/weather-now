import { CurrentConditions, DailyPoint, HourlyPoint } from "@/types/weather";
import { Dictionary } from "@/i18n";
import { conditionKind, isWet } from "@/lib/conditions";
import { wearTier } from "@/lib/wear";
import { hourOfDay } from "@/lib/datetime";

export type InsightTone = "good" | "info" | "warn" | "alert";

export interface Insight {
  id: string;
  icon:
    | "shirt"
    | "umbrella"
    | "sun"
    | "wind"
    | "snow"
    | "thermometer"
    | "clock"
    | "droplets";
  title: string;
  text: string;
  tone: InsightTone;
}

/** Formatters in the visitor's language and unit system. */
export interface InsightFormat {
  hour: (unix: number) => string;
  /** A temperature, °C in. */
  temp: (c: number) => string;
  /** A temperature difference, °C in. */
  tempDelta: (c: number) => string;
  /** A speed, m/s in. */
  speed: (ms: number) => string;
}

/**
 * A small set of human-readable takeaways. These are heuristics meant to make
 * the numbers actionable, not meteorological advice. Thresholds are metric;
 * every number shown goes through `fmt`, so it follows the unit toggle.
 */
export function buildInsights(
  t: Dictionary,
  current: CurrentConditions,
  hourly: HourlyPoint[],
  today: DailyPoint | undefined,
  tz: string,
  fmt: InsightFormat
): Insight[] {
  const insights: Insight[] = [];
  const feels = current.feelsLike;
  const kind = conditionKind(current.code);
  const next12 = hourly.slice(0, 12);

  insights.push({
    id: "wear",
    icon: "shirt",
    title: t.insights.feelsTitle(fmt.temp(feels)),
    text: t.insights.wear[wearTier(feels)],
    tone: feels <= 0 || feels >= 30 ? "warn" : "good",
  });

  // Hours without a probability (only ever at the far end of the range) count as dry.
  const pop = (h: HourlyPoint) => h.pop ?? 0;
  const wettest = next12.reduce<HourlyPoint | null>(
    (best, item) => (!best || pop(item) > pop(best) ? item : best),
    null
  );
  if (wettest && pop(wettest) >= 0.3) {
    insights.push({
      id: "rain",
      icon: "umbrella",
      title: t.insights.umbrellaTitle,
      text: t.insights.umbrellaText(pop(wettest), fmt.hour(wettest.time)),
      tone: pop(wettest) >= 0.6 ? "alert" : "warn",
    });
  } else if (!isWet(current.code)) {
    insights.push({
      id: "dry",
      icon: "sun",
      title: t.insights.dryTitle,
      text: t.insights.dryText,
      tone: "good",
    });
  }

  const gust = current.windGust ?? current.windSpeed;
  const gustKmh = gust * 3.6;
  if (gustKmh >= 40) {
    insights.push({
      id: "wind",
      icon: "wind",
      title: t.insights.windTitle,
      text: t.insights.windText(fmt.speed(gust)),
      tone: gustKmh >= 65 ? "alert" : "warn",
    });
  }

  if (kind === "snow" || (feels <= 1 && current.humidity > 80)) {
    insights.push({
      id: "ice",
      icon: "snow",
      title: t.insights.iceTitle,
      text: t.insights.iceText,
      tone: "warn",
    });
  }

  if (today?.uvMax != null && today.uvMax >= 6) {
    insights.push({
      id: "uv",
      icon: "sun",
      title: t.insights.uvTitle,
      text: t.insights.uvText(today.uvMax),
      tone: today.uvMax >= 8 ? "alert" : "warn",
    });
  }

  const best = bestHour(hourly, tz);
  if (best) {
    insights.push({
      id: "best-hour",
      icon: "clock",
      title: t.insights.bestTitle(fmt.hour(best.time)),
      text: t.insights.bestText(fmt.temp(best.temp), best.pop ?? 0),
      tone: "info",
    });
  }

  const temps = hourly.slice(0, 24).map((h) => h.temp);
  if (temps.length > 1) {
    const swing = Math.max(...temps) - Math.min(...temps);
    if (swing >= 10) {
      insights.push({
        id: "swing",
        icon: "thermometer",
        title: t.insights.swingTitle,
        text: t.insights.swingText(fmt.tempDelta(swing)),
        tone: "info",
      });
    }
  }

  if (current.humidity <= 30) {
    insights.push({
      id: "dry-air",
      icon: "droplets",
      title: t.insights.dryAirTitle,
      text: t.insights.dryAirText(current.humidity),
      tone: "info",
    });
  } else if (current.humidity >= 85 && feels >= 24) {
    insights.push({
      id: "muggy",
      icon: "droplets",
      title: t.insights.muggyTitle,
      text: t.insights.muggyText(current.humidity),
      tone: "warn",
    });
  }

  return insights.slice(0, 4);
}

function bestHour(hourly: HourlyPoint[], tz: string): HourlyPoint | null {
  let best: HourlyPoint | null = null;
  let bestScore = -Infinity;

  for (const item of hourly.slice(0, 24)) {
    const hour = hourOfDay(item.time, tz);
    if (hour < 7 || hour > 21) continue;

    const comfort = 22 - Math.abs(item.feelsLike - 21) * 1.4;
    const dry = (1 - (item.pop ?? 0)) * 8;
    const calm = Math.max(0, 6 - item.windSpeed);
    const bright = (100 - item.clouds) / 25;
    const score = comfort + dry + calm + bright;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

export type ActivityId = "running" | "cycling" | "terrace" | "laundry" | "stargazing" | "photo";

export interface ActivityScore {
  id: ActivityId;
  emoji: string;
  /** 0-100 */
  score: number;
  /** 0 forget it … 4 excellent */
  level: number;
}

/** Playful "is today good for…" ratings derived from the current conditions. */
export function activityScores(
  current: CurrentConditions,
  hourly: HourlyPoint[]
): ActivityScore[] {
  const t = current.temp;
  const feels = current.feelsLike;
  const wind = current.windSpeed * 3.6;
  const clouds = current.clouds;
  const humidity = current.humidity;
  const pop = Math.max(0, ...hourly.slice(0, 6).map((h) => h.pop ?? 0));
  const kind = conditionKind(current.code);
  const wet = kind === "rain" || kind === "drizzle" || kind === "thunder";
  const night = !current.isDay;

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const scores: Record<ActivityId, number> = {
    running: clamp(100 - Math.abs(feels - 12) * 4 - pop * 45 - Math.max(0, wind - 20) * 1.5 - (wet ? 20 : 0)),
    cycling: clamp(100 - Math.abs(feels - 18) * 3.2 - pop * 50 - Math.max(0, wind - 12) * 2.2 - (wet ? 25 : 0)),
    terrace: clamp(100 - Math.abs(feels - 23) * 4.5 - pop * 60 - Math.max(0, wind - 15) * 2 - (wet ? 35 : 0)),
    laundry: clamp(100 - pop * 70 - Math.max(0, humidity - 45) * 1.1 + Math.min(20, wind) - (wet ? 30 : 0) + (t > 18 ? 10 : 0)),
    stargazing: clamp(100 - clouds * 0.95 - pop * 40 - (night ? 0 : 45)),
    photo: clamp(60 + (clouds > 20 && clouds < 80 ? 25 : 0) - pop * 25 + (kind === "fog" ? 15 : 0)),
  };

  const emoji: Record<ActivityId, string> = {
    running: "🏃",
    cycling: "🚲",
    terrace: "☕",
    laundry: "🧺",
    stargazing: "🔭",
    photo: "📷",
  };

  return (Object.keys(scores) as ActivityId[]).map((id) => ({
    id,
    emoji: emoji[id],
    score: scores[id],
    level: Math.min(4, Math.floor(scores[id] / 20)),
  }));
}
