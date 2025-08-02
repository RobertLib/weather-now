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
import { CurrentWeather, ForecastItem } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import {
  UnitSystem,
  convertDistance,
  convertSpeed,
  distanceUnit,
  formatPressure,
  formatTemp,
  pressureUnit,
  speedUnit,
  windDescription,
  windDirection,
} from "@/lib/units";
import { dewPoint, dewPointComfort, pressureTrend, sunStrength } from "@/lib/meteo";
import { DaylightInfo } from "@/lib/astro";
import { ArcGauge, CompassGauge, RingGauge, SegmentGauge } from "./Gauges";

interface HighlightsGridProps {
  weather: CurrentWeather;
  hourly: ForecastItem[];
  theme: SkyTheme;
  units: UnitSystem;
  daylight: DaylightInfo;
}

export default function HighlightsGrid({
  weather,
  hourly,
  theme,
  units,
  daylight,
}: HighlightsGridProps) {
  const accent = theme.accent;
  const dp = dewPoint(weather.main.temp, weather.main.humidity);
  const trend = pressureTrend(
    weather.main.pressure,
    hourly.slice(0, 2).map((h) => h.main.pressure)
  );
  const visibilityKm = weather.visibility / 1000;
  const sun = sunStrength(
    weather.clouds.all,
    daylight.progress,
    daylight.isDay
  );

  const TrendIcon =
    trend.direction === "rising"
      ? TrendingUp
      : trend.direction === "falling"
      ? TrendingDown
      : Minus;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Tile
        delay={0}
        icon={<Droplets className="h-4 w-4" aria-hidden="true" />}
        title="Humidity"
        hint={`Dew point ${formatTemp(dp, units)} · ${dewPointComfort(dp)}`}
        visual={
          <RingGauge
            value={weather.main.humidity}
            color={accent}
            label={`${weather.main.humidity}%`}
          />
        }
      />

      <Tile
        delay={1}
        icon={<Wind className="h-4 w-4" aria-hidden="true" />}
        title="Wind"
        value={`${Math.round(convertSpeed(weather.wind.speed, units))} ${speedUnit(units)}`}
        hint={`${windDirection(weather.wind.deg)} · ${windDescription(weather.wind.speed)}`}
        visual={<CompassGauge degrees={weather.wind.deg} color={accent} />}
      />

      <Tile
        delay={2}
        icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
        title="Pressure"
        hint={
          <span className="inline-flex items-center gap-1">
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {trend.label}
          </span>
        }
        visual={
          <ArcGauge
            value={weather.main.pressure}
            min={960}
            max={1060}
            color={accent}
            label={`${formatPressure(weather.main.pressure, units)} ${pressureUnit(units)}`}
          />
        }
      />

      <Tile
        delay={3}
        icon={<Eye className="h-4 w-4" aria-hidden="true" />}
        title="Visibility"
        value={`${convertDistance(weather.visibility, units).toFixed(1)} ${distanceUnit(units)}`}
        hint={
          visibilityKm >= 10
            ? "Crystal clear"
            : visibilityKm >= 4
            ? "Fairly clear"
            : visibilityKm >= 1
            ? "Hazy"
            : "Very poor"
        }
        visual={
          <div className="text-slate-400 dark:text-slate-500">
            <SegmentGauge ratio={visibilityKm / 10} color={accent} />
          </div>
        }
      />

      <Tile
        delay={4}
        icon={<Cloud className="h-4 w-4" aria-hidden="true" />}
        title="Cloud cover"
        hint={
          weather.clouds.all < 15
            ? "Wide open sky"
            : weather.clouds.all < 50
            ? "Scattered clouds"
            : weather.clouds.all < 85
            ? "Mostly cloudy"
            : "Fully overcast"
        }
        visual={
          <RingGauge
            value={weather.clouds.all}
            color={accent}
            label={`${weather.clouds.all}%`}
          />
        }
      />

      <Tile
        delay={5}
        icon={<Sun className="h-4 w-4" aria-hidden="true" />}
        title="Sun strength"
        value={daylight.isDay ? `${sun.toFixed(1)} / 10` : "After dark"}
        hint={
          !daylight.isDay
            ? "The sun is below the horizon"
            : sun >= 7
            ? "Strong — use sunscreen"
            : sun >= 4
            ? "Moderate exposure"
            : "Low exposure"
        }
        visual={
          <div className="text-amber-400/60">
            <SegmentGauge ratio={sun / 10} color="#f59e0b" />
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
