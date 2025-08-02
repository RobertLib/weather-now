"use client";

import { ForecastItem } from "@/types/weather";
import { getWeatherIcon } from "@/lib/weather";
import Image from "next/image";
import { Droplets } from "lucide-react";

interface HourlyForecastProps {
  forecast: ForecastItem[];
}

export default function HourlyForecast({ forecast }: HourlyForecastProps) {
  const next24Hours = forecast.slice(0, 8); // Next 24 hours (every 3 hours)

  const formatTime = (timestamp: number, index: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();

    // Check if this is within the current hour
    const isCurrentHour =
      index === 0 && Math.abs(date.getTime() - now.getTime()) < 90 * 60 * 1000; // Within 90 minutes

    if (isCurrentHour) {
      return "Now";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
        Today Hourly
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {next24Hours.map((item, index) => (
          <div
            key={item.dt}
            className="flex-shrink-0 bg-gray-50 rounded-lg p-3 sm:p-4 text-center min-w-[100px] sm:min-w-[120px]"
          >
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
              {formatTime(item.dt, index)}
            </div>

            <Image
              src={getWeatherIcon(item.weather[0].icon)}
              alt={item.weather[0].description}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2"
            />

            <div className="text-base sm:text-lg font-bold text-gray-800 mb-1">
              {Math.round(item.main.temp)}°
            </div>

            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-blue-500">
              <Droplets className="w-3 h-3" />
              <span>{Math.round(item.pop * 100)}%</span>
            </div>

            <div className="text-xs text-gray-500 mt-1 capitalize leading-tight">
              {item.weather[0].description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
