"use client";

import { CurrentWeather } from "@/types/weather";
import { getWeatherIcon } from "@/lib/weather";
import Image from "next/image";
import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
} from "lucide-react";

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
}

export default function CurrentWeatherCard({
  weather,
}: CurrentWeatherCardProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
            {weather.name}, {weather.sys.country}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
            {formatDate()}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <Image
            src={getWeatherIcon(weather.weather[0].icon)}
            alt={weather.weather[0].description}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20"
          />
          <div className="text-center sm:text-right">
            <div className="text-4xl sm:text-4xl lg:text-5xl font-bold">
              {Math.round(weather.main.temp)}°
            </div>
            <div className="text-blue-100 capitalize text-sm sm:text-base lg:text-lg">
              {weather.weather[0].description}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 sm:mb-6 justify-center sm:justify-start">
        <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm sm:text-base">
          Feels like: {Math.round(weather.main.feels_like)}°C
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Humidity</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {weather.main.humidity}%
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Wind</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {Math.round(weather.wind.speed * 3.6)} km/h
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Visibility</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {(weather.visibility / 1000).toFixed(1)} km
          </div>
        </div>

        <div className="bg-white/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Pressure</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {weather.main.pressure} hPa
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20 gap-2 sm:gap-0 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Sunrise className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">
            Sunrise: {formatTime(weather.sys.sunrise)}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Sunset className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">
            Sunset: {formatTime(weather.sys.sunset)}
          </span>
        </div>
      </div>
    </div>
  );
}
