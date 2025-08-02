"use client";

import { Star, X } from "lucide-react";
import { SavedCity } from "@/types/weather";
import { UnitSystem, formatTemp } from "@/lib/units";
import WeatherIcon from "./WeatherIcon";

export interface FavoritePreview {
  temp: number;
  conditionId: number;
  icon: string;
}

interface FavoritesBarProps {
  cities: SavedCity[];
  previews: Record<string, FavoritePreview>;
  activeId: string | null;
  units: UnitSystem;
  onSelect: (city: SavedCity) => void;
  onRemove: (id: string) => void;
}

export default function FavoritesBar({
  cities,
  previews,
  activeId,
  units,
  onSelect,
  onRemove,
}: FavoritesBarProps) {
  if (!cities.length) return null;

  return (
    <div className="animate-rise">
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.65rem] font-semibold tracking-wider text-white/70 uppercase">
        <Star className="h-3 w-3" aria-hidden="true" />
        Your places
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
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  aria-current={active ? "true" : undefined}
                  className="flex items-center gap-2 py-2 text-left text-white focus-visible:outline-none"
                >
                  {preview ? (
                    <WeatherIcon
                      id={preview.conditionId}
                      icon={preview.icon}
                      className="h-7 w-7 shrink-0"
                      animated={false}
                    />
                  ) : (
                    <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/25" />
                  )}
                  <span className="min-w-0">
                    <span className="block max-w-32 truncate text-xs font-semibold">
                      {city.name}
                    </span>
                    <span className="tabular block text-[0.65rem] text-white/70">
                      {preview ? formatTemp(preview.temp, units) : "—"}
                      {city.country ? ` · ${city.country}` : ""}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(city.id)}
                  aria-label={`Remove ${city.name} from your places`}
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
