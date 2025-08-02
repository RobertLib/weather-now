"use client";

import { useState } from "react";
import { ChevronDown, CloudRain, Droplets, Wind } from "lucide-react";
import { DailyForecast } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import {
  UnitSystem,
  convertSpeed,
  convertTemp,
  formatTemp,
  speedUnit,
  windDirection,
} from "@/lib/units";
import { formatLocalDayMonth, formatLocalHour, formatLocalWeekday } from "@/lib/datetime";
import WeatherIcon from "./WeatherIcon";

interface WeeklyForecastProps {
  forecast: DailyForecast[];
  tz: number;
  units: UnitSystem;
  theme: SkyTheme;
}

export default function WeeklyForecast({
  forecast,
  tz,
  units,
  theme,
}: WeeklyForecastProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const weekMin = Math.min(...forecast.map((d) => d.temp_min));
  const weekMax = Math.max(...forecast.map((d) => d.temp_max));
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <ul className="divide-y divide-slate-900/8 dark:divide-white/8">
      {forecast.map((day, index) => {
        const isOpen = expanded === day.date;
        const left = ((day.temp_min - weekMin) / weekSpan) * 100;
        const width = ((day.temp_max - day.temp_min) / weekSpan) * 100;

        return (
          <li key={day.date}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : day.date)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-2xl px-1 py-2.5 text-left transition-colors hover:bg-slate-900/4 sm:gap-3 sm:px-2 dark:hover:bg-white/6"
            >
              <div className="w-16 shrink-0 sm:w-24">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {index === 0
                    ? "Today"
                    : index === 1
                    ? "Tomorrow"
                    : formatLocalWeekday(day.dt, tz, "short")}
                </p>
                <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
                  {formatLocalDayMonth(day.dt, tz)}
                </p>
              </div>

              <WeatherIcon
                id={day.weather.id}
                icon={day.weather.icon}
                className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
                animated={false}
                title={day.weather.description}
              />

              <div className="hidden min-w-0 flex-1 sm:block">
                <p className="truncate text-sm font-medium text-slate-700 capitalize dark:text-slate-200">
                  {day.weather.description}
                </p>
                <p className="tabular flex items-center gap-3 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {Math.round(day.pop * 100)}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="h-3 w-3" aria-hidden="true" />
                    {Math.round(convertSpeed(day.wind_speed, units))}{" "}
                    {speedUnit(units)}
                  </span>
                </p>
              </div>

              {/* Temperature range within the week */}
              <div className="flex flex-1 items-center gap-2 sm:max-w-47.5 sm:flex-none">
                <span className="tabular w-9 shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                  {formatTemp(day.temp_min, units)}
                </span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                  <span
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(6, width)}%`,
                      background: `linear-gradient(90deg, #38bdf8, ${theme.accent}, #fb923c)`,
                    }}
                  />
                </span>
                <span className="tabular w-9 shrink-0 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formatTemp(day.temp_max, units)}
                </span>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="animate-rise pb-3">
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat
                    label="Precipitation"
                    value={`${day.precipitation.toFixed(1)} mm`}
                    icon={<CloudRain className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label="Rain chance"
                    value={`${Math.round(day.pop * 100)}%`}
                    icon={<Droplets className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label="Max wind"
                    value={`${Math.round(convertSpeed(day.wind_speed, units))} ${speedUnit(units)} ${windDirection(day.wind_deg)}`}
                    icon={<Wind className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat label="Avg humidity" value={`${day.humidity}%`} />
                </div>

                <div className="scroll-strip flex gap-2">
                  {day.items.map((item) => (
                    <div
                      key={item.dt}
                      className="glass-soft flex w-18.5 shrink-0 flex-col items-center rounded-xl px-1.5 py-2 text-center"
                    >
                      <span className="text-[0.65rem] font-semibold text-slate-600 dark:text-slate-300">
                        {formatLocalHour(item.dt, tz)}
                      </span>
                      <WeatherIcon
                        id={item.weather[0].id}
                        icon={item.weather[0].icon}
                        className="my-0.5 h-8 w-8"
                        animated={false}
                      />
                      <span className="tabular text-sm font-bold text-slate-800 dark:text-slate-100">
                        {Math.round(convertTemp(item.main.temp, units))}°
                      </span>
                      <span className="tabular text-[0.62rem] text-sky-600 dark:text-sky-300">
                        {Math.round(item.pop * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass-soft rounded-xl px-3 py-2">
      <p className="flex items-center gap-1 text-[0.62rem] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {icon}
        {label}
      </p>
      <p className="tabular text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
