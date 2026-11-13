"use client";

import { Droplets, Wind } from "lucide-react";
import { HourlyPoint } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import { UnitSystem, convertSpeed, formatTemp, speedUnit } from "@/lib/units";
import { dayKey, formatHour, formatWeekday } from "@/lib/datetime";
import { useI18n } from "@/i18n/client";
import { describe } from "@/i18n";
import WeatherIcon from "./WeatherIcon";

interface HourlyForecastProps {
  items: HourlyPoint[];
  tz: string;
  units: UnitSystem;
  theme: SkyTheme;
  /** Current time in ms, from `useNow`. */
  now: number;
}

export default function HourlyForecast({ items, tz, units, theme, now }: HourlyForecastProps) {
  const { t, locale } = useI18n();
  const todayKey = items.length ? dayKey(items[0].time, tz) : "";
  // Only call the first slot "Now" when it really is the current hour.
  const firstIsNow =
    now > 0 && items.length > 0 && now / 1000 - items[0].time < 3600 && now / 1000 >= items[0].time;

  return (
    <div className="scroll-strip -mx-4 flex scroll-px-4 gap-2.5 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:gap-3 sm:px-6">
      {items.map((item, index) => {
        const sameDay = dayKey(item.time, tz) === todayKey;
        return (
          <div
            key={item.time}
            className="glass-soft animate-rise flex w-21 shrink-0 flex-col items-center rounded-2xl px-2 py-3 text-center sm:w-24 sm:px-3"
            style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
          >
            <span className="text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300">
              {index === 0 && firstIsNow ? t.common.now : formatHour(item.time, tz, locale)}
            </span>
            {!sameDay && (
              <span className="text-[0.6rem] font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                {formatWeekday(item.time, tz, locale, "short")}
              </span>
            )}

            <WeatherIcon
              code={item.code}
              night={!item.isDay}
              className="my-1 h-11 w-11 sm:h-12 sm:w-12"
              animated={index < 4}
              title={describe(t, item.code)}
            />

            <span className="font-display tabular text-lg font-bold text-slate-800 dark:text-slate-100">
              {formatTemp(item.temp, units)}
            </span>

            <span
              className="tabular mt-1 inline-flex items-center gap-1 text-[0.68rem] font-medium"
              style={{ color: item.pop !== null && item.pop >= 0.3 ? theme.accent : undefined }}
            >
              <Droplets className="h-3 w-3" aria-hidden="true" />
              {item.pop === null ? "—" : `${Math.round(item.pop * 100)}%`}
            </span>
            <span className="tabular mt-0.5 inline-flex items-center gap-1 text-[0.68rem] text-slate-500 dark:text-slate-400">
              <Wind className="h-3 w-3" aria-hidden="true" />
              {Math.round(convertSpeed(item.windSpeed, units))}
              <span className="text-[0.58rem]">{speedUnit(units)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
