"use client";

import {
  Cloud,
  Droplets,
  Eye,
  Gauge,
  Sun,
  TrendingDown,
  TrendingUp,
  Minus,
  Wind,
} from "lucide-react";
import { CurrentConditions, HourlyPoint } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import {
  UnitSystem,
  compassIndex,
  convertDistance,
  convertSpeed,
  distanceUnit,
  formatPressure,
  formatTemp,
  pressureUnit,
  speedUnit,
  windLevel,
} from "@/lib/units";
import { UV_COLORS, dewComfortLevel, dewPoint, pressureTrend, uvLevel } from "@/lib/meteo";
import { useI18n } from "@/i18n/client";
import { ArcGauge, CompassGauge, RingGauge, SegmentGauge } from "./Gauges";

interface HighlightsGridProps {
  current: CurrentConditions;
  hourly: HourlyPoint[];
  theme: SkyTheme;
  units: UnitSystem;
  /** Today's peak UV, used when the sun is down. */
  uvMax: number | null;
}

export default function HighlightsGrid({
  current,
  hourly,
  theme,
  units,
  uvMax,
}: HighlightsGridProps) {
  const { t } = useI18n();
  const h = t.highlights;
  const accent = theme.accent;
  const dp = dewPoint(current.temp, current.humidity);
  const trend = pressureTrend(current.pressure, hourly[3]?.pressure);
  const visibility = hourly[0]?.visibility ?? null;
  const visibilityKm = visibility === null ? null : visibility / 1000;
  const uvNow = hourly[0]?.uv ?? null;
  const uv = current.isDay ? uvNow : null;
  const uvShown = uv ?? uvMax ?? 0;
  const level = uvLevel(uvShown);
  const clouds = current.clouds;

  const TrendIcon =
    trend === "rising" ? TrendingUp : trend === "falling" ? TrendingDown : Minus;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Tile
        delay={0}
        icon={<Droplets className="h-4 w-4" aria-hidden="true" />}
        title={t.common.humidity}
        hint={h.dewPoint(formatTemp(dp, units), h.dewComfort[dewComfortLevel(dp)])}
        visual={
          <RingGauge value={current.humidity} color={accent} label={`${current.humidity}%`} />
        }
      />

      <Tile
        delay={1}
        icon={<Wind className="h-4 w-4" aria-hidden="true" />}
        title={t.common.wind}
        value={`${Math.round(convertSpeed(current.windSpeed, units))} ${speedUnit(units)}`}
        hint={`${h.compass[compassIndex(current.windDir)]} · ${h.windLevels[windLevel(current.windSpeed)]}${
          current.windGust !== null && current.windGust > current.windSpeed * 1.3
            ? ` · ${t.common.gusts.toLowerCase()} ${Math.round(convertSpeed(current.windGust, units))}`
            : ""
        }`}
        visual={<CompassGauge degrees={current.windDir} color={accent} />}
      />

      <Tile
        delay={2}
        icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
        title={h.pressure}
        hint={
          <span className="inline-flex items-center gap-1">
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {h.trend[trend]}
          </span>
        }
        visual={
          <ArcGauge
            value={current.pressure}
            min={960}
            max={1060}
            color={accent}
            label={`${formatPressure(current.pressure, units)} ${pressureUnit(units)}`}
          />
        }
      />

      <Tile
        delay={3}
        icon={<Eye className="h-4 w-4" aria-hidden="true" />}
        title={h.visibility}
        value={
          visibility === null
            ? "—"
            : `${convertDistance(visibility, units).toFixed(visibilityKm! >= 10 ? 0 : 1)} ${distanceUnit(units)}`
        }
        hint={
          visibilityKm === null
            ? undefined
            : h.visibilityLevels[visibilityKm >= 10 ? 3 : visibilityKm >= 4 ? 2 : visibilityKm >= 1 ? 1 : 0]
        }
        visual={
          <div className="text-slate-400 dark:text-slate-500">
            <SegmentGauge ratio={(visibilityKm ?? 0) / 20} color={accent} />
          </div>
        }
      />

      <Tile
        delay={4}
        icon={<Cloud className="h-4 w-4" aria-hidden="true" />}
        title={h.clouds}
        hint={h.cloudLevels[clouds < 15 ? 0 : clouds < 50 ? 1 : clouds < 85 ? 2 : 3]}
        visual={<RingGauge value={clouds} color={accent} label={`${clouds}%`} />}
      />

      <Tile
        delay={5}
        icon={<Sun className="h-4 w-4" aria-hidden="true" />}
        title={t.common.uv}
        value={
          uv !== null
            ? `${Math.round(uv)} · ${h.uvLevels[level]}`
            : uvMax !== null
              ? `${t.daily.uvMax} ${Math.round(uvMax)}`
              : h.afterDark
        }
        hint={uv !== null ? h.uvAdvice[level] : h.belowHorizon}
        visual={
          <div className="text-amber-400/60">
            <SegmentGauge ratio={Math.min(1, uvShown / 11)} color={UV_COLORS[level]} />
          </div>
        }
      />
    </div>
  );
}

function Tile({
  icon,
  title,
  value,
  hint,
  visual,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  hint?: React.ReactNode;
  visual: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="glass animate-rise flex flex-col rounded-2xl p-3.5 text-slate-800 sm:p-4 dark:text-slate-100"
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {icon}
        {title}
      </div>

      <div className="my-2.5 flex flex-1 items-center justify-center">
        {visual}
      </div>

      <div className="min-h-8">
        {value && (
          <p className="tabular font-display text-lg leading-tight font-bold">
            {value}
          </p>
        )}
        {hint && (
          <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
