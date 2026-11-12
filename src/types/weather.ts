/**
 * Normalised weather model. Everything from the upstream API is converted into
 * these shapes in `lib/openmeteo.ts`, so components never see raw responses.
 *
 * Units: °C, m/s, hPa, mm, metres, unix seconds. Probabilities are 0-1.
 */

export interface CurrentConditions {
  time: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windGust: number | null;
  windDir: number;
  clouds: number;
  precipitation: number;
  /** WMO weather interpretation code. */
  code: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  pop: number;
  precipitation: number;
  code: number;
  clouds: number;
  pressure: number;
  windSpeed: number;
  windGust: number | null;
  windDir: number;
  visibility: number | null;
  uv: number | null;
  isDay: boolean;
}

export interface DailyPoint {
  /** `YYYY-MM-DD` in the location's own calendar. */
  date: string;
  /** Local midnight as unix seconds. */
  time: number;
  code: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipHours: number;
  pop: number | null;
  windMax: number;
  gustMax: number | null;
  windDir: number;
  uvMax: number | null;
  /** Unix seconds; null during polar day or polar night (see `daylight`). */
  sunrise: number | null;
  sunset: number | null;
  /** Seconds; 0 during polar night, 86 400 during polar day. */
  daylight: number;
  /** Seconds. */
  sunshine: number | null;
}

export interface Forecast {
  lat: number;
  lon: number;
  elevation: number;
  /** IANA zone, e.g. `Europe/Prague`. */
  timezone: string;
  /** Milliseconds; when this snapshot was fetched upstream. */
  fetchedAt: number;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export type PollenType =
  | "alder"
  | "birch"
  | "grass"
  | "mugwort"
  | "olive"
  | "ragweed";

export interface Pollutants {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
}

export interface AirQuality {
  time: number;
  timezone: string;
  /** European AQI, 0 (clean) upwards; above 100 is extremely poor. */
  europeanAqi: number | null;
  usAqi: number | null;
  pollutants: Pollutants;
  /** Grains/m³. Only modelled for Europe; empty elsewhere. */
  pollen: Partial<Record<PollenType, number>>;
  /** Daily worst-case European AQI for the next few days. */
  days: Array<{ date: string; time: number; europeanAqi: number | null }>;
}

/** A search hit or any coordinate pair worth naming. */
export interface GeoLocation {
  /** GeoNames id when known. */
  id?: number;
  name: string;
  lat: number;
  lon: number;
  /** ISO 3166-1 alpha-2. */
  cc: string;
  country?: string;
  admin1?: string;
}

/**
 * Labels of a curated place in every language. Stored places carry them so a
 * place saved on the Czech site still reads (and links) in English, and back.
 */
export type PlaceLabels = Partial<
  Record<"en" | "cs", { name: string; countryName?: string; path: string }>
>;

/** A place the dashboard can show — curated or ad hoc. */
export interface PlaceRef {
  name: string;
  cc: string;
  countryName?: string;
  lat: number;
  lon: number;
  /** Canonical page for curated places. */
  path?: string;
  i18n?: PlaceLabels;
}

/** A city the user pinned for one-tap access. */
export interface SavedCity {
  id: string;
  name: string;
  cc: string;
  lat: number;
  lon: number;
  path?: string;
  i18n?: PlaceLabels;
}
