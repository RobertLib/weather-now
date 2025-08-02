import {
  AirQuality,
  CurrentWeather,
  DailyForecast,
  ForecastData,
  ForecastItem,
  GeoLocation,
} from "@/types/weather";
import { localDayKey, localHourOfDay } from "@/lib/datetime";

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

if (!API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_OPENWEATHER_API_KEY is not defined in environment variables"
  );
}

async function request<T>(url: string, what: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "We couldn't find that place. Check the spelling or try a nearby city."
      );
    }
    if (response.status === 401) {
      throw new Error("The weather service rejected our API key.");
    }
    if (response.status === 429) {
      throw new Error(
        "Too many requests right now — please try again in a moment."
      );
    }
    throw new Error(`Error loading ${what}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentWeather(city: string): Promise<CurrentWeather> {
  return request(
    `${BASE_URL}/weather?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric&lang=en`,
    "weather"
  );
}

export async function getCurrentWeatherByCoords(
  lat: number,
  lon: number
): Promise<CurrentWeather> {
  return request(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`,
    "weather"
  );
}

export async function getForecast(city: string): Promise<ForecastData> {
  return request(
    `${BASE_URL}/forecast?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric&lang=en`,
    "forecast"
  );
}

export async function getForecastByCoords(
  lat: number,
  lon: number
): Promise<ForecastData> {
  return request(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`,
    "forecast"
  );
}

export async function getAirQuality(
  lat: number,
  lon: number
): Promise<AirQuality> {
  return request(
    `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
    "air quality"
  );
}

/** City suggestions for the search box. */
export async function searchLocations(
  query: string,
  limit = 5
): Promise<GeoLocation[]> {
  if (query.trim().length < 2) return [];
  return request(
    `${GEO_URL}/direct?q=${encodeURIComponent(
      query.trim()
    )}&limit=${limit}&appid=${API_KEY}`,
    "locations"
  );
}

function precipitationOf(item: ForecastItem): number {
  return (item.rain?.["3h"] ?? 0) + (item.snow?.["3h"] ?? 0);
}

/**
 * Collapse the 3-hourly forecast into per-day summaries.
 *
 * Days are bucketed by the *location's* calendar date, and each day's icon is
 * taken from the slot nearest local midday so a clear afternoon isn't
 * represented by a 3 a.m. reading.
 */
export function processDailyForecast(
  forecastData: ForecastData,
  tzOffsetSeconds = forecastData.city.timezone
): DailyForecast[] {
  const buckets = new Map<string, ForecastItem[]>();

  for (const item of forecastData.list) {
    const key = localDayKey(item.dt, tzOffsetSeconds);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  const days = Array.from(buckets.entries()).map(([date, items]) => {
    const middayItem = items.reduce((best, item) =>
      Math.abs(localHourOfDay(item.dt, tzOffsetSeconds) - 13) <
      Math.abs(localHourOfDay(best.dt, tzOffsetSeconds) - 13)
        ? item
        : best
    );

    return {
      date,
      dt: items[0].dt,
      temp_min: Math.min(...items.map((i) => i.main.temp_min)),
      temp_max: Math.max(...items.map((i) => i.main.temp_max)),
      weather: middayItem.weather[0],
      humidity: Math.round(
        items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length
      ),
      wind_speed: Math.max(...items.map((i) => i.wind.speed)),
      wind_deg: middayItem.wind.deg,
      pop: Math.max(...items.map((i) => i.pop)),
      precipitation: items.reduce((sum, i) => sum + precipitationOf(i), 0),
      items,
    };
  });

  // The window usually ends mid-day. A trailing bucket covering less than half
  // a day would advertise a high/low derived from a few night-time readings, so
  // it's dropped rather than shown as a full day. The leading bucket is kept:
  // a partial "today" is expected.
  if (days.length > 1 && days[days.length - 1].items.length < 4) days.pop();

  return days;
}

/** Forecast slots that haven't happened yet, for the hourly strip and chart. */
export function upcomingHours(
  forecastData: ForecastData,
  count = 12
): ForecastItem[] {
  const cutoff = Date.now() / 1000 - 3 * 3600;
  const upcoming = forecastData.list.filter((item) => item.dt >= cutoff);
  return (upcoming.length ? upcoming : forecastData.list).slice(0, count);
}
