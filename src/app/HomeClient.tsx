"use client";

import { useState, useEffect } from "react";
import { CurrentWeather, ForecastData, DailyForecast } from "@/types/weather";
import {
  getCurrentWeather,
  getCurrentWeatherByCoords,
  getForecast,
  getForecastByCoords,
  processDailyForecast,
} from "@/lib/weather";
import { generateWeatherSchema, generateBreadcrumbSchema } from "@/lib/schema";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import HourlyForecast from "@/components/HourlyForecast";
import WeeklyForecast from "@/components/WeeklyForecast";
import SearchBar from "@/components/SearchBar";
import ErrorMessage from "@/components/ErrorMessage";

export default function HomeClient() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null
  );
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (city: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [weather, forecast] = await Promise.all([
        getCurrentWeather(city),
        getForecast(city),
      ]);

      setCurrentWeather(weather);
      setForecastData(forecast);
      setDailyForecast(processDailyForecast(forecast));
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherByLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const [weather, forecast] = await Promise.all([
            getCurrentWeatherByCoords(latitude, longitude),
            getForecastByCoords(latitude, longitude),
          ]);

          setCurrentWeather(weather);
          setForecastData(forecast);
          setDailyForecast(processDailyForecast(forecast));
        } catch (err) {
          console.error("Error loading data:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading data."
          );
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Failed to get your location. Try entering a city manually.");
        setIsLoading(false);
      }
    );
  };

  // Load weather for Prague on first load
  useEffect(() => {
    fetchWeatherData("Prague");
  }, []);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateWeatherSchema(
              currentWeather?.name,
              currentWeather?.main.temp,
              currentWeather?.weather[0].description
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema()),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 pt-4 pb-8">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent drop-shadow-sm">
                Weather
                <span className="text-2xl sm:text-3xl lg:text-4xl text-white">
                  {" "}
                  ⛅{" "}
                </span>
                Now
              </h1>
              <p className="text-gray-600 mt-2 font-medium tracking-wide text-sm sm:text-base px-4">
                Get accurate real-time weather forecasts and current conditions
                for any location worldwide
              </p>
            </div>

            <SearchBar
              onSearch={fetchWeatherData}
              onLocationSearch={fetchWeatherByLocation}
              isLoading={isLoading}
            />

            {error && (
              <ErrorMessage message={error} onClose={() => setError(null)} />
            )}

            {currentWeather && (
              <section
                className="space-y-4 sm:space-y-6"
                aria-label="Weather Information"
              >
                <CurrentWeatherCard weather={currentWeather} />

                {forecastData && (
                  <section aria-label="Hourly Forecast">
                    <HourlyForecast forecast={forecastData.list} />
                  </section>
                )}

                {dailyForecast.length > 0 && (
                  <section aria-label="Weekly Forecast">
                    <WeeklyForecast forecast={dailyForecast} />
                  </section>
                )}
              </section>
            )}

            {isLoading && !currentWeather && (
              <div
                className="text-center py-8 sm:py-12"
                role="status"
                aria-live="polite"
              >
                <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600 text-sm sm:text-base">
                  Loading weather data...
                </p>
              </div>
            )}

            {!currentWeather && !isLoading && !error && (
              <section className="text-center py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-3 sm:mb-4">
                  Welcome to WeatherNow
                </h2>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                  Search for any city to get real-time weather information,
                  hourly forecasts, and 7-day predictions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                    <h3 className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">
                      Real-Time Data
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Get current weather conditions including temperature,
                      humidity, and wind speed.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                    <h3 className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">
                      Hourly Forecast
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      View detailed hourly predictions for the next 48 hours.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                    <h3 className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">
                      7-Day Outlook
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Plan ahead with accurate weekly weather forecasts.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
