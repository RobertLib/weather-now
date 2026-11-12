"use client";

import { ArrowDown, ArrowUp, Heart, MapPin, RefreshCw, Share2 } from "lucide-react";
import { CurrentConditions, DailyPoint } from "@/types/weather";
import { SkyTheme, heroGradient } from "@/lib/conditions";
import { UnitSystem, formatTemp, speedUnit, convertSpeed } from "@/lib/units";
import { formatDate, formatTime } from "@/lib/datetime";
import { useI18n } from "@/i18n/client";
import { describe } from "@/i18n";
import WeatherIcon from "./WeatherIcon";

interface CurrentWeatherCardProps {
  name: string;
  countryName?: string;
  current: CurrentConditions;
  tz: string;
  today?: DailyPoint;
  theme: SkyTheme;
  units: UnitSystem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRefresh: () => void;
  onShare: () => void;
  lastUpdated: number;
  isRefreshing: boolean;
  /** Current time in ms, from `useNow`. */
  now: number;
}

export default function CurrentWeatherCard({
  name,
  countryName,
  current,
  tz,
  today,
  theme,
  units,
  isFavorite,
  onToggleFavorite,
  onRefresh,
  onShare,
  lastUpdated,
  isRefreshing,
  now,
}: CurrentWeatherCardProps) {
  const { t, locale } = useI18n();
  const high = today ? today.tempMax : current.temp;
  const low = today ? today.tempMin : current.temp;
  const condition = describe(t, current.code);

  return (
    <section
      className="animate-rise relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl sm:p-7"
      style={{ background: heroGradient(theme) }}
      aria-label={t.current.aria}
    >
      {/* Decorative light */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-white/80">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <h2 className="font-display truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                {name}
                {countryName ? `, ${countryName}` : ""}
              </h2>
            </div>
            <p className="mt-1 text-sm text-white/75">
              {formatDate(current.time, tz, locale)} ·{" "}
              <span className="tabular">{formatTime(current.time, tz, locale)}</span>{" "}
              {t.common.localTime}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <IconButton
              label={isFavorite ? t.favorites.unsave : t.favorites.save}
              onClick={onToggleFavorite}
              active={isFavorite}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                aria-hidden="true"
              />
            </IconButton>
            <IconButton label={t.current.share} onClick={onShare}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            <IconButton label={t.current.refresh} onClick={onRefresh}>
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </IconButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 sm:mt-7">
          <div className="flex items-center gap-3 sm:gap-5">
            <WeatherIcon
              code={current.code}
              night={!current.isDay}
              className="h-20 w-20 shrink-0 drop-shadow-lg sm:h-28 sm:w-28"
              title={condition}
            />
            <div>
              <div className="font-display tabular flex items-start text-6xl leading-none font-bold tracking-tighter sm:text-7xl">
                {formatTemp(current.temp, units)}
              </div>
              <p className="mt-1.5 text-base font-medium sm:text-lg">{condition}</p>
              <p className="text-sm text-white/75">
                {t.common.feelsLike} {formatTemp(current.feelsLike, units)}
              </p>
            </div>
          </div>

          <dl className="flex items-center gap-2.5 sm:gap-3">
            <Stat
              icon={<ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t.common.high}
              value={formatTemp(high, units)}
            />
            <Stat
              icon={<ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />}
              label={t.common.low}
              value={formatTemp(low, units)}
            />
            <Stat
              label={t.common.wind}
              value={`${Math.round(convertSpeed(current.windSpeed, units))}`}
              suffix={speedUnit(units)}
            />
          </dl>
        </div>

        <p className="mt-5 text-xs text-white/60">
          {t.common.updatedAgo(relativeTime(t, lastUpdated, now || lastUpdated))}
        </p>
      </div>
    </section>
  );
}

function relativeTime(
  t: ReturnType<typeof useI18n>["t"],
  from: number,
  now: number
): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 45) return t.common.justNow;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t.common.minAgo(minutes);
  return t.common.hoursAgo(Math.round(minutes / 60));
}

function IconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`grid h-9 w-9 place-items-center rounded-full border transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none active:scale-95 ${
        active
          ? "border-rose-200/60 bg-rose-500/90 text-white"
          : "border-white/25 bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-2 text-center backdrop-blur-sm sm:px-4">
      <dt className="flex items-center justify-center gap-1 text-[0.68rem] font-medium tracking-wide text-white/75 uppercase">
        {icon}
        {label}
      </dt>
      <dd className="tabular mt-0.5 text-lg font-bold sm:text-xl">
        {value}
        {suffix && (
          <span className="ml-0.5 text-[0.6rem] font-medium text-white/70">
            {suffix}
          </span>
        )}
      </dd>
    </div>
  );
}
