import {
  AirQuality,
  CurrentConditions,
  DailyPoint,
  Forecast,
  GeoLocation,
  HourlyPoint,
  PollenType,
} from "@/types/weather";
import { dayKey } from "@/lib/datetime";

/**
 * Open-Meteo client (https://open-meteo.com, CC BY 4.0). No API key.
 * Works on both sides: server callers pass `{ next: { revalidate } }` so one
 * upstream call serves every page of a city; the browser calls it directly so
 * live refreshes count against the visitor's own rate limit, not the server's.
 */

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

/**
 * With a (commercial) API key, server requests go to the customer endpoints,
 * which have their own quota instead of the shared free per-IP limit.
 */
function endpoint(url: string, apiKey?: string): string {
  return apiKey ? url.replace("https://", "https://customer-") : url;
}
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

export const FORECAST_DAYS = 16;

type FetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
  /** Server-only Open-Meteo key; never set this in the browser. */
  apiKey?: string;
};

export class WeatherApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "WeatherApiError";
  }
}

async function getJson<T>(url: string, init?: FetchInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let reason = response.statusText;
    try {
      const body = (await response.json()) as { reason?: string };
      if (body.reason) reason = body.reason;
    } catch {
      /* non-JSON error body */
    }
    throw new WeatherApiError(response.status, reason);
  }
  return response.json() as Promise<T>;
}

/** ~100 m precision keeps cache keys stable without moving the grid cell. */
export function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/* ------------------------------------------------------------------ forecast */

const CURRENT_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
] as const;

const HOURLY_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation_probability",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "visibility",
  "uv_index",
  "is_day",
] as const;

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "daylight_duration",
  "sunshine_duration",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_hours",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
] as const;

type Series<K extends string> = { time: number[] } & Record<K, Array<number | null>>;

interface RawForecast {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: { time: number } & Record<(typeof CURRENT_VARS)[number], number | null>;
  hourly: Series<(typeof HOURLY_VARS)[number]>;
  daily: Series<(typeof DAILY_VARS)[number]>;
}

export function forecastUrl(lat: number, lon: number, apiKey?: string): string {
  const params = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lon)),
    current: CURRENT_VARS.join(","),
    hourly: HOURLY_VARS.join(","),
    daily: DAILY_VARS.join(","),
    timezone: "auto",
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: "ms",
    timeformat: "unixtime",
  });
  if (apiKey) params.set("apikey", apiKey);
  return `${endpoint(FORECAST_URL, apiKey)}?${params}`;
}

const num = (value: number | null | undefined, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const opt = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function normalizeForecast(raw: RawForecast, fetchedAt = Date.now()): Forecast {
  const c = raw.current;
  const current: CurrentConditions = {
    time: c.time,
    temp: num(c.temperature_2m),
    feelsLike: num(c.apparent_temperature, num(c.temperature_2m)),
    humidity: num(c.relative_humidity_2m),
    pressure: num(c.pressure_msl, 1013),
    windSpeed: num(c.wind_speed_10m),
    windGust: opt(c.wind_gusts_10m),
    windDir: num(c.wind_direction_10m),
    clouds: num(c.cloud_cover),
    precipitation: num(c.precipitation),
    code: num(c.weather_code),
    isDay: c.is_day === 1,
  };

  const h = raw.hourly;
  const hourly: HourlyPoint[] = h.time.map((time, i) => ({
    time,
    temp: num(h.temperature_2m[i]),
    feelsLike: num(h.apparent_temperature[i], num(h.temperature_2m[i])),
    humidity: num(h.relative_humidity_2m[i]),
    pop: num(h.precipitation_probability[i]) / 100,
    precipitation: num(h.precipitation[i]),
    code: num(h.weather_code[i]),
    clouds: num(h.cloud_cover[i]),
    pressure: num(h.pressure_msl[i], 1013),
    windSpeed: num(h.wind_speed_10m[i]),
    windGust: opt(h.wind_gusts_10m[i]),
    windDir: num(h.wind_direction_10m[i]),
    visibility: opt(h.visibility[i]),
    uv: opt(h.uv_index[i]),
    isDay: h.is_day[i] === 1,
  }));

  const d = raw.daily;
  const daily: DailyPoint[] = d.time
    .map((time, i) => ({
      date: dayKey(time, raw.timezone),
      time,
      code: num(d.weather_code[i]),
      tempMax: num(d.temperature_2m_max[i], NaN),
      tempMin: num(d.temperature_2m_min[i], NaN),
      precipitation: num(d.precipitation_sum[i]),
      precipHours: num(d.precipitation_hours[i]),
      pop: d.precipitation_probability_max[i] == null ? null : num(d.precipitation_probability_max[i]) / 100,
      windMax: num(d.wind_speed_10m_max[i]),
      gustMax: opt(d.wind_gusts_10m_max[i]),
      windDir: num(d.wind_direction_10m_dominant[i]),
      uvMax: opt(d.uv_index_max[i]),
      sunrise: num(d.sunrise[i]),
      sunset: num(d.sunset[i]),
      daylight: num(d.daylight_duration[i]),
      sunshine: opt(d.sunshine_duration[i]),
    }))
    // The last model day is sometimes only partially filled.
    .filter((day) => Number.isFinite(day.tempMax) && Number.isFinite(day.tempMin));

  return {
    lat: raw.latitude,
    lon: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    fetchedAt,
    current,
    hourly,
    daily,
  };
}

export async function fetchForecast(
  lat: number,
  lon: number,
  init?: FetchInit
): Promise<Forecast> {
  const response = await fetch(forecastUrl(lat, lon, init?.apiKey), init);
  if (!response.ok) throw new WeatherApiError(response.status, response.statusText);
  const raw = (await response.json()) as RawForecast;
  // A cached server response keeps its original Date header, which tells the
  // browser how old the snapshot really is. (Browsers can't read it via CORS.)
  const date = Date.parse(response.headers.get("date") ?? "");
  return normalizeForecast(raw, Number.isFinite(date) ? Math.min(date, Date.now()) : Date.now());
}

/** Hours from the current one onward. */
export function upcomingHours(forecast: Forecast, count: number, now = Date.now()): HourlyPoint[] {
  const cutoff = now / 1000 - 3600;
  const start = forecast.hourly.findIndex((h) => h.time > cutoff);
  return forecast.hourly.slice(Math.max(0, start), Math.max(0, start) + count);
}

/**
 * What the dashboard actually draws: every hour for the next two days, then
 * three-hourly slots for the expandable day rows. Keeps the serialized props
 * of server-rendered pages small.
 */
export function slimForecast(forecast: Forecast, now = Date.now()): Forecast {
  const start = now / 1000 - 3600;
  const dense = start + 49 * 3600;
  return {
    ...forecast,
    hourly: forecast.hourly.filter(
      (h) => h.time >= start && (h.time < dense || h.time % 10800 === 0)
    ),
    daily: upcomingDays(forecast, now),
  };
}

/** Daily rows from today (in the location's calendar) onward. */
export function upcomingDays(forecast: Forecast, now = Date.now()): DailyPoint[] {
  const today = dayKey(now / 1000, forecast.timezone);
  const index = forecast.daily.findIndex((d) => d.date >= today);
  return index < 0 ? [] : forecast.daily.slice(index);
}

/* ------------------------------------------------------------- air quality */

const POLLEN: Record<PollenType, string> = {
  alder: "alder_pollen",
  birch: "birch_pollen",
  grass: "grass_pollen",
  mugwort: "mugwort_pollen",
  olive: "olive_pollen",
  ragweed: "ragweed_pollen",
};

const AIR_CURRENT = [
  "european_aqi",
  "us_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
  ...Object.values(POLLEN),
];

interface RawAir {
  timezone: string;
  current: { time: number } & Record<string, number | null>;
  hourly: { time: number[]; european_aqi: Array<number | null> };
}

export function airUrl(lat: number, lon: number, apiKey?: string): string {
  const params = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lon)),
    current: AIR_CURRENT.join(","),
    hourly: "european_aqi",
    timezone: "auto",
    forecast_days: "4",
    timeformat: "unixtime",
  });
  if (apiKey) params.set("apikey", apiKey);
  return `${endpoint(AIR_URL, apiKey)}?${params}`;
}

export function normalizeAir(raw: RawAir): AirQuality {
  const c = raw.current;
  const pollen: AirQuality["pollen"] = {};
  for (const [type, key] of Object.entries(POLLEN) as Array<[PollenType, string]>) {
    const value = opt(c[key]);
    if (value !== null) pollen[type] = value;
  }

  const byDay = new Map<string, { time: number; max: number | null }>();
  raw.hourly.time.forEach((time, i) => {
    const key = dayKey(time, raw.timezone);
    const value = opt(raw.hourly.european_aqi[i]);
    const entry = byDay.get(key);
    if (!entry) byDay.set(key, { time, max: value });
    else if (value !== null && (entry.max === null || value > entry.max)) entry.max = value;
  });

  return {
    time: c.time,
    timezone: raw.timezone,
    europeanAqi: opt(c.european_aqi),
    usAqi: opt(c.us_aqi),
    pollutants: {
      pm2_5: opt(c.pm2_5),
      pm10: opt(c.pm10),
      no2: opt(c.nitrogen_dioxide),
      o3: opt(c.ozone),
      so2: opt(c.sulphur_dioxide),
      co: opt(c.carbon_monoxide),
    },
    pollen,
    days: [...byDay.entries()].map(([date, { time, max }]) => ({
      date,
      time,
      europeanAqi: max,
    })),
  };
}

export async function fetchAirQuality(
  lat: number,
  lon: number,
  init?: FetchInit
): Promise<AirQuality> {
  return normalizeAir(await getJson<RawAir>(airUrl(lat, lon, init?.apiKey), init));
}

/* ---------------------------------------------------------- batch snapshot */

export interface Snapshot {
  temp: number;
  code: number;
  isDay: boolean;
}

/**
 * Current temperature for many places in one request (Open-Meteo accepts
 * comma-separated coordinates). Used by hub pages and the homepage grid.
 */
export async function fetchSnapshots(
  points: Array<{ lat: number; lon: number }>,
  init?: FetchInit
): Promise<Array<Snapshot | null>> {
  const results: Array<Snapshot | null> = [];
  for (let i = 0; i < points.length; i += 50) {
    const chunk = points.slice(i, i + 50);
    const params = new URLSearchParams({
      latitude: chunk.map((p) => roundCoord(p.lat)).join(","),
      longitude: chunk.map((p) => roundCoord(p.lon)).join(","),
      current: "temperature_2m,weather_code,is_day",
      timezone: "auto",
      forecast_days: "1",
      timeformat: "unixtime",
    });
    if (init?.apiKey) params.set("apikey", init.apiKey);
    type Raw = { current: { temperature_2m: number; weather_code: number; is_day: number } };
    const raw = await getJson<Raw | Raw[]>(`${endpoint(FORECAST_URL, init?.apiKey)}?${params}`, init);
    const list = Array.isArray(raw) ? raw : [raw];
    for (const item of list) {
      results.push(
        item?.current
          ? {
              temp: item.current.temperature_2m,
              code: item.current.weather_code,
              isDay: item.current.is_day === 1,
            }
          : null
      );
    }
  }
  return results;
}

/* --------------------------------------------------------------- geocoding */

interface RawGeo {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country_code?: string;
    country?: string;
    admin1?: string;
  }>;
}

export async function searchLocations(
  query: string,
  language: string,
  count = 6
): Promise<GeoLocation[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const params = new URLSearchParams({
    name: term,
    count: String(count),
    language,
    format: "json",
  });
  const raw = await getJson<RawGeo>(`${GEO_URL}?${params}`);
  return (raw.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    cc: r.country_code ?? "",
    country: r.country,
    admin1: r.admin1,
  }));
}
