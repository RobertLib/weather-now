"use client";

import { Leaf } from "lucide-react";
import { AirQuality } from "@/types/weather";
import { aqiInfo, pollutants } from "@/lib/air";
import { BarGauge } from "./Gauges";
import Card from "./Card";

interface AirQualityCardProps {
  air: AirQuality;
  delay?: number;
}

export default function AirQualityCard({ air, delay = 0 }: AirQualityCardProps) {
  const index = air.list[0]?.main.aqi ?? 3;
  const info = aqiInfo(index);
  const readings = pollutants(air);

  return (
    <Card
      title="Air quality"
      subtitle="OpenWeather AQI, 1 (best) to 5"
      icon={<Leaf className="h-4 w-4" aria-hidden="true" />}
      delay={delay}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white shadow-lg"
          style={{ backgroundColor: info.color }}
        >
          {info.index}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold" style={{ color: info.color }}>
            {info.label}
          </p>
          <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
            {info.advice}
          </p>
        </div>
      </div>

      {/* Scale */}
      <div className="mt-4 flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full transition-opacity"
            style={{
              backgroundColor: aqiInfo(step).color,
              opacity: step === index ? 1 : 0.25,
            }}
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
                  {reading.value < 10
                    ? reading.value.toFixed(1)
                    : Math.round(reading.value)}
                  <span className="ml-0.5 text-[0.6rem] font-normal text-slate-400">
                    {reading.unit}
                  </span>
                </dd>
              </div>
              <BarGauge
                ratio={reading.ratio}
                color={info.color}
                className="mt-1"
              />
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
