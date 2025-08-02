import { CurrentWeather, ForecastItem } from "@/types/weather";
import { conditionKind } from "@/lib/conditions";
import { formatLocalHour, localHourOfDay } from "@/lib/datetime";

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
    | "sparkles"
    | "clock"
    | "droplets";
  title: string;
  text: string;
  tone: InsightTone;
}

/**
 * A small set of human-readable takeaways. These are heuristics meant to make
 * the numbers actionable, not meteorological advice.
 */
export function buildInsights(
  weather: CurrentWeather,
  hourly: ForecastItem[],
  tz: number
): Insight[] {
  const insights: Insight[] = [];
  const feels = weather.main.feels_like;
  const kind = conditionKind(weather.weather[0].id, weather.clouds.all);
  const next12 = hourly.slice(0, 4);

  // What to wear.
  const wear =
    feels <= -5
      ? "Heavy coat, hat and gloves — it bites out there."
      : feels <= 4
      ? "Winter coat and a scarf will keep you comfortable."
      : feels <= 12
      ? "A jacket or warm layer is the right call."
      : feels <= 19
      ? "Long sleeves or a light layer should be plenty."
      : feels <= 27
      ? "T-shirt weather — travel light."
      : "Loose, light clothing and plenty of water.";
  insights.push({
    id: "wear",
    icon: "shirt",
    title: `Feels like ${Math.round(feels)}°`,
    text: wear,
    tone: feels <= 0 || feels >= 30 ? "warn" : "good",
  });

  // Rain in the coming hours.
  const wettest = next12.reduce<ForecastItem | null>(
    (best, item) => (!best || item.pop > best.pop ? item : best),
    null
  );
  if (wettest && wettest.pop >= 0.3) {
    insights.push({
      id: "rain",
      icon: "umbrella",
      title: "Take an umbrella",
      text: `${Math.round(wettest.pop * 100)}% chance of precipitation around ${formatLocalHour(
        wettest.dt,
        tz
      )}.`,
      tone: wettest.pop >= 0.6 ? "alert" : "warn",
    });
  } else if (kind === "clear" || kind === "partly") {
    insights.push({
      id: "dry",
      icon: "sun",
      title: "Dry spell ahead",
      text: "No meaningful precipitation expected in the next 12 hours.",
      tone: "good",
    });
  }

  // Wind and gusts.
  const gust = weather.wind.gust ?? weather.wind.speed;
  if (gust * 3.6 >= 40) {
    insights.push({
      id: "wind",
      icon: "wind",
      title: "Windy conditions",
      text: `Gusts up to ${Math.round(gust * 3.6)} km/h — secure loose items outdoors.`,
      tone: gust * 3.6 >= 65 ? "alert" : "warn",
    });
  }

  // Snow / ice.
  if (kind === "snow" || (feels <= 1 && weather.main.humidity > 80)) {
    insights.push({
      id: "ice",
      icon: "snow",
      title: "Watch for ice",
      text: "Temperatures near freezing with high moisture — surfaces may be slippery.",
      tone: "warn",
    });
  }

  // The nicest hour to step outside.
  const best = bestHour(hourly, tz);
  if (best) {
    insights.push({
      id: "best-hour",
      icon: "clock",
      title: `Best window: ${formatLocalHour(best.dt, tz)}`,
      text: `${Math.round(best.main.temp)}° with ${Math.round(
        best.pop * 100
      )}% rain chance — the pick of the next two days.`,
      tone: "info",
    });
  }

  // Big temperature swing coming.
  const temps = hourly.slice(0, 8).map((h) => h.main.temp);
  if (temps.length > 1) {
    const swing = Math.max(...temps) - Math.min(...temps);
    if (swing >= 10) {
      insights.push({
        id: "swing",
        icon: "thermometer",
        title: "Big temperature swing",
        text: `About ${Math.round(swing)}° between the high and low over the next 24 hours — dress in layers.`,
        tone: "info",
      });
    }
  }

  // Dry air / very humid air.
  if (weather.main.humidity <= 30) {
    insights.push({
      id: "dry-air",
      icon: "droplets",
      title: "Very dry air",
      text: `Humidity is only ${weather.main.humidity}% — keep a water bottle nearby.`,
      tone: "info",
    });
  } else if (weather.main.humidity >= 85 && feels >= 24) {
    insights.push({
      id: "muggy",
      icon: "droplets",
      title: "Muggy out",
      text: `${weather.main.humidity}% humidity makes it feel heavier than the thermometer says.`,
      tone: "warn",
    });
  }

  return insights.slice(0, 4);
}

function bestHour(hourly: ForecastItem[], tz: number): ForecastItem | null {
  let best: ForecastItem | null = null;
  let bestScore = -Infinity;

  for (const item of hourly.slice(0, 16)) {
    const hour = localHourOfDay(item.dt, tz);
    if (hour < 7 || hour > 21) continue;

    const comfort = 22 - Math.abs(item.main.feels_like - 21) * 1.4;
    const dry = (1 - item.pop) * 8;
    const calm = Math.max(0, 6 - item.wind.speed);
    const bright = (100 - item.clouds.all) / 25;
    const score = comfort + dry + calm + bright;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

export interface ActivityScore {
  id: string;
  label: string;
  emoji: string;
  /** 0-100 */
  score: number;
  verdict: string;
}

/** Playful "is today good for…" ratings derived from the current conditions. */
export function activityScores(
  weather: CurrentWeather,
  hourly: ForecastItem[],
  night: boolean
): ActivityScore[] {
  const t = weather.main.temp;
  const feels = weather.main.feels_like;
  const wind = weather.wind.speed * 3.6;
  const clouds = weather.clouds.all;
  const humidity = weather.main.humidity;
  const pop = Math.max(0, ...hourly.slice(0, 3).map((h) => h.pop));
  const kind = conditionKind(weather.weather[0].id, clouds);
  const wet = kind === "rain" || kind === "drizzle" || kind === "thunder";

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const running = clamp(
    100 -
      Math.abs(feels - 12) * 4 -
      pop * 45 -
      Math.max(0, wind - 20) * 1.5 -
      (wet ? 20 : 0)
  );

  const cycling = clamp(
    100 -
      Math.abs(feels - 18) * 3.2 -
      pop * 50 -
      Math.max(0, wind - 12) * 2.2 -
      (wet ? 25 : 0)
  );

  const outdoorDining = clamp(
    100 -
      Math.abs(feels - 23) * 4.5 -
      pop * 60 -
      Math.max(0, wind - 15) * 2 -
      (wet ? 35 : 0)
  );

  const laundry = clamp(
    100 - pop * 70 - Math.max(0, humidity - 45) * 1.1 + Math.min(20, wind) - (wet ? 30 : 0) + (t > 18 ? 10 : 0)
  );

  const stargazing = clamp(100 - clouds * 0.95 - pop * 40 - (night ? 0 : 45));

  const photography = clamp(
    60 + (clouds > 20 && clouds < 80 ? 25 : 0) - pop * 25 + (kind === "fog" ? 15 : 0)
  );

  const verdict = (s: number) =>
    s >= 80
      ? "Excellent"
      : s >= 60
      ? "Good"
      : s >= 40
      ? "So-so"
      : s >= 20
      ? "Poor"
      : "Forget it";

  return [
    { id: "running", label: "Running", emoji: "🏃", score: running, verdict: verdict(running) },
    { id: "cycling", label: "Cycling", emoji: "🚲", score: cycling, verdict: verdict(cycling) },
    { id: "terrace", label: "Terrace", emoji: "☕", score: outdoorDining, verdict: verdict(outdoorDining) },
    { id: "laundry", label: "Line drying", emoji: "🧺", score: laundry, verdict: verdict(laundry) },
    { id: "stargazing", label: "Stargazing", emoji: "🔭", score: stargazing, verdict: verdict(stargazing) },
    { id: "photo", label: "Photography", emoji: "📷", score: photography, verdict: verdict(photography) },
  ];
}
