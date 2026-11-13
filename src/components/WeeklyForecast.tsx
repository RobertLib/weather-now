"use client";

import { useState } from "react";
import { ChevronDown, CloudRain, Droplets, Sun, Wind } from "lucide-react";
import { DailyPoint, HourlyPoint } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import {
  UnitSystem,
  compassIndex,
  convertSpeed,
  convertTemp,
  formatTemp,
  speedUnit,
} from "@/lib/units";
import { dayKey, formatDayMonth, formatDuration, formatHour, formatTime, formatWeekday } from "@/lib/datetime";
import { isThreeHourSlot } from "@/lib/openmeteo";
import { useI18n } from "@/i18n/client";
import { describe } from "@/i18n";
import WeatherIcon from "./WeatherIcon";

interface WeeklyForecastProps {
  days: DailyPoint[];
  hourly: HourlyPoint[];
  tz: string;
  units: UnitSystem;
  theme: SkyTheme;
}

export default function WeeklyForecast({ days, hourly, tz, units, theme }: WeeklyForecastProps) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);

  const weekMin = Math.min(...days.map((d) => d.tempMin));
  const weekMax = Math.max(...days.map((d) => d.tempMax));
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <ul className="divide-y divide-slate-900/8 dark:divide-white/8">
      {days.map((day, index) => {
        const isOpen = expanded === day.date;
        const left = ((day.tempMin - weekMin) / weekSpan) * 100;
        const width = ((day.tempMax - day.tempMin) / weekSpan) * 100;
        const condition = describe(t, day.code);
        const hours = isOpen
          ? hourly.filter((h) => dayKey(h.time, tz) === day.date && isThreeHourSlot(h.time, tz))
          : [];

        return (
          <li key={day.date}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : day.date)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-2xl px-1 py-2.5 text-left transition-colors hover:bg-slate-900/4 sm:gap-3 sm:px-2 dark:hover:bg-white/6"
            >
              <div className="w-16 shrink-0 sm:w-24">
                <p className="text-sm font-semibold text-slate-800 capitalize dark:text-slate-100">
                  {index === 0
                    ? t.common.today
                    : index === 1
                      ? t.common.tomorrow
                      : formatWeekday(day.time, tz, locale, "short")}
                </p>
                <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
                  {formatDayMonth(day.time, tz, locale)}
                </p>
              </div>

              <WeatherIcon
                code={day.code}
                className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
                animated={false}
                title={condition}
              />

              <div className="hidden min-w-0 flex-1 sm:block">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {condition}
                </p>
                <p className="tabular flex items-center gap-3 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {day.pop === null ? "—" : `${Math.round(day.pop * 100)}%`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="h-3 w-3" aria-hidden="true" />
                    {Math.round(convertSpeed(day.windMax, units))} {speedUnit(units)}
                  </span>
                </p>
              </div>

              {/* Temperature range within the period */}
              <div className="flex flex-1 items-center gap-2 sm:max-w-47.5 sm:flex-none">
                <span className="tabular w-9 shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                  {formatTemp(day.tempMin, units)}
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
                  {formatTemp(day.tempMax, units)}
                </span>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <div className="animate-rise pb-3">
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat
                    label={t.common.precipitation}
                    value={`${day.precipitation.toFixed(1)} mm`}
                    icon={<CloudRain className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label={t.common.rainChance}
                    value={day.pop === null ? "—" : `${Math.round(day.pop * 100)}%`}
                    icon={<Droplets className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label={t.daily.maxWind}
                    value={`${Math.round(convertSpeed(day.windMax, units))} ${speedUnit(units)} ${t.highlights.compass[compassIndex(day.windDir)]}`}
                    icon={<Wind className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label={t.daily.uvMax}
                    value={day.uvMax === null ? "—" : String(Math.round(day.uvMax))}
                    icon={<Sun className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                  <MiniStat
                    label={t.common.sunrise}
                    value={day.sunrise === null ? "—" : formatTime(day.sunrise, tz, locale)}
                  />
                  <MiniStat
                    label={t.common.sunset}
                    value={day.sunset === null ? "—" : formatTime(day.sunset, tz, locale)}
                  />
                  <MiniStat label={t.common.daylight} value={formatDuration(day.daylight / 60)} />
                  {day.sunshine !== null && (
                    <MiniStat label={t.common.sunshine} value={formatDuration(day.sunshine / 60)} />
                  )}
                </div>

                {hours.length > 0 && (
                  <div className="scroll-strip flex gap-2">
                    {hours.map((item) => (
                      <div
                        key={item.time}
                        className="glass-soft flex w-18.5 shrink-0 flex-col items-center rounded-xl px-1.5 py-2 text-center"
                      >
                        <span className="text-[0.65rem] font-semibold text-slate-600 dark:text-slate-300">
                          {formatHour(item.time, tz, locale)}
                        </span>
                        <WeatherIcon
                          code={item.code}
                          night={!item.isDay}
                          className="my-0.5 h-8 w-8"
                          animated={false}
                        />
                        <span className="tabular text-sm font-bold text-slate-800 dark:text-slate-100">
                          {Math.round(convertTemp(item.temp, units))}°
                        </span>
                        <span className="tabular text-[0.62rem] text-sky-600 dark:text-sky-300">
                          {Math.round(item.pop * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
