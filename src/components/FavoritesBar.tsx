"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import { SavedCity } from "@/types/weather";
import { formatTemp } from "@/lib/units";
import { Snapshot, fetchSnapshots } from "@/lib/openmeteo";
import { homePath } from "@/lib/routes";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUnits } from "@/hooks/useUnits";
import { useI18n } from "@/i18n/client";
import WeatherIcon from "./WeatherIcon";

export const FAVORITES_KEY = "weathernow:favorites";
export const MAX_FAVORITES = 8;

/** Older saves used `country` for the country code. */
type StoredCity = SavedCity & { country?: string };

export function useFavorites() {
  return useLocalStorage<StoredCity[]>(FAVORITES_KEY, []);
}

export function favoriteId(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function hrefFor(city: StoredCity, base: string): string {
  if (city.path) return city.path;
  const params = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    name: city.name,
  });
  return `${base}?${params}`;
}

/** Saved places with live temperatures, fetched in one batched request. */
export default function FavoritesBar({ activeId }: { activeId?: string | null }) {
  const { t, locale } = useI18n();
  const [cities, setCities] = useFavorites();
  const [units] = useUnits();
  const [previews, setPreviews] = useState<Record<string, Snapshot>>({});
  const key = cities.map((c) => c.id).join("|");

  useEffect(() => {
    if (!cities.length) return;
    let stale = false;
    fetchSnapshots(cities)
      .then((snaps) => {
        if (stale) return;
        const next: Record<string, Snapshot> = {};
        snaps.forEach((snap, i) => {
          if (snap) next[cities[i].id] = snap;
        });
        setPreviews(next);
      })
      .catch(() => {
        /* previews are decorative */
      });
    return () => {
      stale = true;
    };
    // Only refetch when the set of places changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!cities.length) return null;
  const base = homePath(locale);

  return (
    <div className="animate-rise">
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.65rem] font-semibold tracking-wider text-white/70 uppercase">
        <Star className="h-3 w-3" aria-hidden="true" />
        {t.favorites.heading}
      </p>
      <ul className="scroll-strip -mx-4 flex gap-2 px-4 pb-1 sm:-mx-1 sm:px-1">
        {cities.map((city) => {
          const preview = previews[city.id];
          const active = city.id === activeId;

          return (
            <li key={city.id} className="shrink-0">
              <div
                className={`group flex items-center gap-1.5 rounded-2xl border pr-1 pl-3 transition-all ${
                  active
                    ? "border-white/60 bg-white/30 shadow-lg backdrop-blur-md"
                    : "border-white/25 bg-white/15 backdrop-blur-md hover:bg-white/25"
                }`}
              >
                <Link
                  href={hrefFor(city, base)}
                  aria-current={active ? "true" : undefined}
                  className="flex items-center gap-2 py-2 text-left text-white focus-visible:outline-none"
                >
                  {preview ? (
                    <WeatherIcon
                      code={preview.code}
                      night={!preview.isDay}
                      className="h-7 w-7 shrink-0"
                      animated={false}
                    />
                  ) : (
                    <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/25" />
                  )}
                  <span className="min-w-0">
                    <span className="block max-w-32 truncate text-xs font-semibold">{city.name}</span>
                    <span className="tabular block text-[0.65rem] text-white/70">
                      {preview ? formatTemp(preview.temp, units) : "—"}
                      {city.cc ?? city.country ? ` · ${city.cc ?? city.country}` : ""}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setCities((current) => current.filter((c) => c.id !== city.id))}
                  aria-label={t.favorites.remove(city.name)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
