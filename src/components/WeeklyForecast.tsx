"use client";

import { DailyForecast } from "@/types/weather";
import { getWeatherIcon } from "@/lib/weather";
import Image from "next/image";
import { Droplets, Wind, Gauge } from "lucide-react";

interface WeeklyForecastProps {
  forecast: DailyForecast[];
}

export default function WeeklyForecast({ forecast }: WeeklyForecastProps) {
  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
        7-Day Forecast
      </h3>

      <div className="space-y-2 sm:space-y-3">
        {forecast.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-gray-700 shrink-0">
                {formatDay(day.date)}
              </div>

              <Image
                src={getWeatherIcon(day.weather.icon)}
                alt={day.weather.description}
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-800 capitalize truncate">
                  {day.weather.description}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    <span>{Math.round(day.pop * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    <span>{Math.round(day.wind_speed * 3.6)} km/h</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    <span>{day.humidity}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 text-right shrink-0">
              <span className="text-base sm:text-lg font-bold text-gray-800">
                {Math.round(day.temp_max)}°
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {Math.round(day.temp_min)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
