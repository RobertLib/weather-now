"use client";

import { Flower2, Leaf } from "lucide-react";
import { AirQuality, PollenType } from "@/types/weather";
import { AQI_COLORS, POLLEN_COLORS, aqiLevel, pollenLevel, pollutantReadings } from "@/lib/air";
import { useI18n } from "@/i18n/client";
import { BarGauge } from "./Gauges";
import Card from "./Card";

interface AirQualityCardProps {
  air: AirQuality;
  delay?: number;
}

export default function AirQualityCard({ air, delay = 0 }: AirQualityCardProps) {
  const { t } = useI18n();
  if (air.europeanAqi === null) return null;

  const index = air.europeanAqi;
  const level = aqiLevel(index);
  const color = AQI_COLORS[level];
  const readings = pollutantReadings(air.pollutants);
  const pollen = (Object.entries(air.pollen) as Array<[PollenType, number]>)
    .map(([type, value]) => ({ type, value, level: pollenLevel(type, value) }))
    .filter((p) => p.level > 0)
    .sort((a, b) => b.level - a.level);

  return (
    <Card
      title={t.air.title}
      subtitle={t.air.subtitle}
      icon={<Leaf className="h-4 w-4" aria-hidden="true" />}
      delay={delay}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {Math.round(index)}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold" style={{ color }}>
            {t.air.levels[level]}
          </p>
          <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
            {t.air.advice[level]}
          </p>
          {air.usAqi !== null && (
            <p className="mt-0.5 text-[0.68rem] text-slate-500 dark:text-slate-400">
              {t.air.usAqi} {Math.round(air.usAqi)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-1" aria-hidden="true">
        {AQI_COLORS.map((c, step) => (
          <span
            key={c}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: c, opacity: step === level ? 1 : 0.25 }}
          />
        ))}
      </div>

      {readings.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {readings.map((reading) => (
            <div key={reading.key}>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[0.7rem] font-medium text-slate-500 dark:text-slate-400">
                  {reading.label}
                </dt>
                <dd className="tabular text-xs font-semibold">
                  {reading.value < 10 ? reading.value.toFixed(1) : Math.round(reading.value)}
                  <span className="ml-0.5 text-[0.6rem] font-normal text-slate-400">µg/m³</span>
                </dd>
              </div>
              <BarGauge ratio={reading.ratio} color={color} className="mt-1" />
            </div>
          ))}
        </dl>
      )}

      {pollen.length > 0 && (
        <div className="mt-4 border-t border-slate-900/8 pt-3 dark:border-white/10">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <Flower2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {t.air.pollen}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {pollen.map((p) => (
              <li
                key={p.type}
                className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold text-white"
                style={{ backgroundColor: POLLEN_COLORS[p.level] }}
              >
                {t.air.pollenTypes[p.type]}: {t.air.pollenLevels[p.level].toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
