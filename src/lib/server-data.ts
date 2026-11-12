import { cache } from "react";
import { AirQuality, Forecast } from "@/types/weather";
import { Snapshot, fetchAirQuality, fetchForecast, fetchSnapshots } from "@/lib/openmeteo";

/**
 * Server-side data access. Every upstream call goes through Next's data cache
 * for an hour, so all pages and both languages of a city share one request —
 * important because Open-Meteo's free tier is rate-limited per server IP.
 * Failures return null: pages still render (and the browser fills in data).
 */

export const REVALIDATE_SECONDS = 3600;

const cached = {
  next: { revalidate: REVALIDATE_SECONDS },
  // Optional paid key (server-only env var); without it the free API is used.
  apiKey: process.env.OPEN_METEO_API_KEY || undefined,
};

export const getForecast = cache(async (lat: number, lon: number): Promise<Forecast | null> => {
  try {
    return await fetchForecast(lat, lon, cached);
  } catch (error) {
    console.error("Forecast fetch failed", lat, lon, error);
    return null;
  }
});

export const getAirQuality = cache(async (lat: number, lon: number): Promise<AirQuality | null> => {
  try {
    return await fetchAirQuality(lat, lon, cached);
  } catch (error) {
    console.error("Air quality fetch failed", lat, lon, error);
    return null;
  }
});

export async function getSnapshots(
  points: Array<{ lat: number; lon: number }>
): Promise<Array<Snapshot | null>> {
  try {
    return await fetchSnapshots(points, cached);
  } catch (error) {
    console.error("Snapshot fetch failed", error);
    return points.map(() => null);
  }
}

/**
 * Wall-clock time (unix seconds) for server components. Pages are rendered
 * once per revalidation window, so reading the clock here is intended.
 */
export function renderTime(): number {
  return Math.floor(Date.now() / 1000);
}
