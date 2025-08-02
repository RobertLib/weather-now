"use client";

import { Droplets, Wind } from "lucide-react";
import { ForecastItem } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import { UnitSystem, convertSpeed, formatTemp, speedUnit } from "@/lib/units";
import { formatLocalHour, formatLocalWeekday, localDayKey } from "@/lib/datetime";
import WeatherIcon from "./WeatherIcon";

interface HourlyForecastProps {
  items: ForecastItem[];
  tz: number;
  units: UnitSystem;
  theme: SkyTheme;
  /** Current time in ms, from `useNow`. */
  now: number;
}

export default function HourlyForecast({
  items,
  tz,
  units,
  theme,
  now,
}: HourlyForecastProps) {
  const todayKey = items.length ? localDayKey(items[0].dt, tz) : "";
  // Slots land on a 3-hour grid, so the first one can be up to 3 hours old.
  // Only call it "Now" when it genuinely is the current window.
  const firstIsNow =
    now > 0 && items.length > 0 && Math.abs(items[0].dt - now / 1000) < 90 * 60;

  return (
    <div className="scroll-strip -mx-4 flex gap-2.5 px-4 pb-2 sm:-mx-6 sm:gap-3 sm:px-6">
      {items.map((item, index) => {
        const sameDay = localDayKey(item.dt, tz) === todayKey;
        return (
          <div
            key={item.dt}
            className="glass-soft animate-rise flex w-23 shrink-0 flex-col items-center rounded-2xl px-2 py-3 text-center sm:w-26 sm:px-3"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <span className="text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300">
              {index === 0 && firstIsNow ? "Now" : formatLocalHour(item.dt, tz)}
            </span>
            {!sameDay && (
              <span className="text-[0.6rem] font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                {formatLocalWeekday(item.dt, tz, "short")}
              </span>
            )}

            <WeatherIcon
              id={item.weather[0].id}
              icon={item.weather[0].icon}
              className="my-1 h-11 w-11 sm:h-12 sm:w-12"
              animated={index < 4}
              title={item.weather[0].description}
            />

            <span className="font-display tabular text-lg font-bold text-slate-800 dark:text-slate-100">
              {formatTemp(item.main.temp, units)}
            </span>

            <span
              className="tabular mt-1 inline-flex items-center gap-1 text-[0.68rem] font-medium"
              style={{ color: item.pop >= 0.3 ? theme.accent : undefined }}
            >
              <Droplets className="h-3 w-3" aria-hidden="true" />
              {Math.round(item.pop * 100)}%
            </span>
            <span className="tabular mt-0.5 inline-flex items-center gap-1 text-[0.68rem] text-slate-500 dark:text-slate-400">
              <Wind className="h-3 w-3" aria-hidden="true" />
              {Math.round(convertSpeed(item.wind.speed, units))}
              <span className="text-[0.58rem]">{speedUnit(units)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
