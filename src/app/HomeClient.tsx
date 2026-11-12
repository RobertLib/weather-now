"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, LineChart, Sparkles } from "lucide-react";
import {
  AirQuality,
  CurrentWeather,
  DailyForecast,
  ForecastData,
  ForecastItem,
  GeoLocation,
  SavedCity,
} from "@/types/weather";
import {
  getAirQuality,
  getCurrentWeather,
  getCurrentWeatherByCoords,
  getForecast,
  getForecastByCoords,
  processDailyForecast,
  upcomingHours,
} from "@/lib/weather";
import { generateWeatherSchema, generateBreadcrumbSchema } from "@/lib/schema";
import {
  DEFAULT_THEME,
  conditionKind,
  isNightIcon,
  skyTheme,
} from "@/lib/conditions";
import { UnitSystem, formatTemp } from "@/lib/units";
import { daylightInfo } from "@/lib/astro";
import { activityScores, buildInsights } from "@/lib/insights";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNow } from "@/hooks/useNow";
import { useTheme } from "@/hooks/useTheme";
import WeatherBackground from "@/components/WeatherBackground";
import SearchBar from "@/components/SearchBar";
import FavoritesBar, { FavoritePreview } from "@/components/FavoritesBar";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import HighlightsGrid from "@/components/HighlightsGrid";
import HourlyForecast from "@/components/HourlyForecast";
import TempChart from "@/components/TempChart";
import WeeklyForecast from "@/components/WeeklyForecast";
import SunMoonCard from "@/components/SunMoonCard";
import AirQualityCard from "@/components/AirQualityCard";
import InsightsCard from "@/components/InsightsCard";
import ActivityCard from "@/components/ActivityCard";
import WeatherSkeleton from "@/components/WeatherSkeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { UnitToggle, ThemeToggle } from "@/components/Toggles";

/** Where we look when there's nothing saved and no URL parameter. */
const FALLBACK_CITY = "Prague";
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const MAX_FAVORITES = 8;

type Target = { kind: "city"; city: string } | { kind: "coords"; lat: number; lon: number; label?: string };

function cityId(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export default function HomeClient() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const now = useNow();

  const [units, setUnits] = useLocalStorage<UnitSystem>(
    "weathernow:units",
    "metric"
  );
  const [favorites, setFavorites] = useLocalStorage<SavedCity[]>(
    "weathernow:favorites",
    []
  );
  const [lastTarget, setLastTarget, lastTargetHydrated] =
    useLocalStorage<Target | null>("weathernow:last", null);
  const { preference, setPreference } = useTheme();

  const [previews, setPreviews] = useState<Record<string, FavoritePreview>>({});
  const targetRef = useRef<Target | null>(null);

  /* ---------------------------------------------------------------- loading */

  const load = useCallback(
    async (target: Target, mode: "initial" | "refresh" = "initial") => {
      targetRef.current = target;
      if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const [weather, forecast] =
          target.kind === "city"
            ? await Promise.all([
                getCurrentWeather(target.city),
                getForecast(target.city),
              ])
            : await Promise.all([
                getCurrentWeatherByCoords(target.lat, target.lon),
                getForecastByCoords(target.lat, target.lon),
              ]);

        setCurrentWeather(weather);
        setForecastData(forecast);
        setDailyForecast(processDailyForecast(forecast, weather.timezone));
        setLastUpdated(Date.now());
        setLastTarget({
          kind: "coords",
          lat: weather.coord.lat,
          lon: weather.coord.lon,
          label: weather.name,
        });

        // Air quality is a bonus panel — a failure here shouldn't break the page.
        getAirQuality(weather.coord.lat, weather.coord.lon)
          .then(setAirQuality)
          .catch(() => setAirQuality(null));
      } catch (err) {
        console.error("Error loading data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading data."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [setLastTarget]
  );

  // First load: URL parameter wins, then the last place viewed, then a default.
  useEffect(() => {
    if (!lastTargetHydrated) return;

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const lat = params.get("lat");
    const lon = params.get("lon");

    const initial: Target =
      lat && lon && !Number.isNaN(+lat) && !Number.isNaN(+lon)
        ? { kind: "coords", lat: +lat, lon: +lon }
        : q
          ? { kind: "city", city: q }
          : (lastTarget ?? { kind: "city", city: FALLBACK_CITY });

    // Fetching on mount is the whole point of this effect. isLoading already
    // starts true and error null, so load()'s synchronous updates are no-ops.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(initial);
    // Intentionally runs once, as soon as stored preferences are available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTargetHydrated]);

  // Keep the URL shareable without adding history entries.
  useEffect(() => {
    if (!currentWeather) return;
    const params = new URLSearchParams();
    params.set("q", currentWeather.name);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [currentWeather]);

  // Periodic background refresh while the tab is visible.
  useEffect(() => {
    const refresh = setInterval(() => {
      if (targetRef.current && document.visibilityState === "visible") {
        load(targetRef.current, "refresh");
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(refresh);
  }, [load]);

  // Live temperatures for the saved-places rail.
  useEffect(() => {
    if (!favorites.length) return;
    let stale = false;

    Promise.allSettled(
      favorites.map((city) => getCurrentWeatherByCoords(city.lat, city.lon))
    ).then((results) => {
      if (stale) return;
      const next: Record<string, FavoritePreview> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          next[favorites[index].id] = {
            temp: result.value.main.temp,
            conditionId: result.value.weather[0].id,
            icon: result.value.weather[0].icon,
          };
        }
      });
      setPreviews((current) => ({ ...current, ...next }));
    });

    return () => {
      stale = true;
    };
  }, [favorites]);

  // A returning visitor sees the temperature straight in the tab title.
  useEffect(() => {
    if (!currentWeather) return;
    document.title = `${formatTemp(currentWeather.main.temp, units)} ${currentWeather.name} · WeatherNow`;
  }, [currentWeather, units]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------------------------------------------------------------- actions */

  const searchByText = useCallback(
    (city: string) => load({ kind: "city", city }),
    [load]
  );

  const selectLocation = useCallback(
    (location: GeoLocation) =>
      load({
        kind: "coords",
        lat: location.lat,
        lon: location.lon,
        label: location.name,
      }),
    [load]
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        load({ kind: "coords", lat: coords.latitude, lon: coords.longitude }),
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          "We couldn't get your location. Try searching for a city instead."
        );
        setIsLoading(false);
      },
      { timeout: 10_000 }
    );
  }, [load]);

  const refresh = useCallback(() => {
    if (targetRef.current) load(targetRef.current, "refresh");
  }, [load]);

  const activeId = currentWeather
    ? cityId(currentWeather.coord.lat, currentWeather.coord.lon)
    : null;
  const isFavorite = !!activeId && favorites.some((c) => c.id === activeId);

  const toggleFavorite = useCallback(() => {
    if (!currentWeather || !activeId) return;
    setFavorites((current) => {
      if (current.some((c) => c.id === activeId)) {
        setToast(`${currentWeather.name} removed from your places`);
        return current.filter((c) => c.id !== activeId);
      }
      if (current.length >= MAX_FAVORITES) {
        setToast(`You can save up to ${MAX_FAVORITES} places`);
        return current;
      }
      setToast(`${currentWeather.name} saved to your places`);
      return [
        ...current,
        {
          id: activeId,
          name: currentWeather.name,
          country: currentWeather.sys.country,
          lat: currentWeather.coord.lat,
          lon: currentWeather.coord.lon,
        },
      ];
    });
  }, [activeId, currentWeather, setFavorites]);

  const removeFavorite = useCallback(
    (id: string) => setFavorites((current) => current.filter((c) => c.id !== id)),
    [setFavorites]
  );

  const share = useCallback(async () => {
    if (!currentWeather) return;
    const text = `${currentWeather.name}: ${formatTemp(
      currentWeather.main.temp,
      units
    )}, ${currentWeather.weather[0].description}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "WeatherNow", text, url });
        return;
      } catch {
        /* user dismissed the share sheet */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} — ${url}`);
      setToast("Link copied to clipboard");
    } catch {
      setToast("Couldn't copy the link");
    }
  }, [currentWeather, units]);

  /* --------------------------------------------------------------- derived */

  const theme = useMemo(() => {
    if (!currentWeather) return DEFAULT_THEME;
    const info = currentWeather.weather[0];
    return skyTheme(
      conditionKind(info.id, currentWeather.clouds.all),
      isNightIcon(info.icon)
    );
  }, [currentWeather]);

  const hourly: ForecastItem[] = useMemo(
    () => (forecastData ? upcomingHours(forecastData, 14) : []),
    [forecastData]
  );

  const daylight = useMemo(
    () =>
      currentWeather
        ? daylightInfo(
            // Falls back to the observation time before the clock is available.
            now > 0 ? Math.floor(now / 1000) : currentWeather.dt,
            currentWeather.sys.sunrise,
            currentWeather.sys.sunset
          )
        : null,
    [currentWeather, now]
  );

  const insights = useMemo(
    () =>
      currentWeather && hourly.length
        ? buildInsights(currentWeather, hourly, currentWeather.timezone)
        : [],
    [currentWeather, hourly]
  );

  const activities = useMemo(
    () =>
      currentWeather && hourly.length
        ? activityScores(currentWeather, hourly, theme.night)
        : [],
    [currentWeather, hourly, theme.night]
  );

  /* ----------------------------------------------------------------- render */

  return (
    <>
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

      <WeatherBackground theme={theme} />

      <div className="px-3 pt-5 pb-12 sm:px-4 sm:pt-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
                Weather
                <span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
                  Now
                </span>
              </h1>
              <p className="mt-1 max-w-xl text-sm text-white/80">
                Live conditions, hour-by-hour trends and a five-day outlook for
                anywhere on Earth.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UnitToggle units={units} onChange={setUnits} />
              <ThemeToggle preference={preference} onChange={setPreference} />
            </div>
          </header>

          <div className="space-y-4 sm:space-y-5">
            <SearchBar
              onSelectLocation={selectLocation}
              onSearchText={searchByText}
              onLocationSearch={useMyLocation}
              isLoading={isLoading || isRefreshing}
            />

            <FavoritesBar
              cities={favorites}
              previews={previews}
              activeId={activeId}
              units={units}
              onSelect={(city) =>
                load({
                  kind: "coords",
                  lat: city.lat,
                  lon: city.lon,
                  label: city.name,
                })
              }
              onRemove={removeFavorite}
            />

            {error && (
              <ErrorMessage
                message={error}
                onClose={() => setError(null)}
                onRetry={refresh}
              />
            )}

            {isLoading && !currentWeather && <WeatherSkeleton />}

            {currentWeather && daylight && (
              <>
                <CurrentWeatherCard
                  weather={currentWeather}
                  today={dailyForecast[0]}
                  theme={theme}
                  units={units}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onRefresh={refresh}
                  onShare={share}
                  lastUpdated={lastUpdated}
                  isRefreshing={isRefreshing}
                  now={now}
                />

                {hourly.length > 0 && (
                  <Panel
                    title="Next 42 hours"
                    subtitle="Three-hour steps, in local time"
                    icon={<Clock className="h-4 w-4" aria-hidden="true" />}
                  >
                    <HourlyForecast
                      items={hourly}
                      tz={currentWeather.timezone}
                      units={units}
                      theme={theme}
                      now={now}
                    />
                  </Panel>
                )}

                {hourly.length > 1 && (
                  <Panel
                    title="Temperature trend"
                    subtitle="Hover a point for the exact reading"
                    icon={<LineChart className="h-4 w-4" aria-hidden="true" />}
                  >
                    <TempChart
                      items={hourly}
                      tz={currentWeather.timezone}
                      units={units}
                      theme={theme}
                    />
                  </Panel>
                )}

                <section aria-label="Today's details">
                  <HighlightsGrid
                    weather={currentWeather}
                    hourly={hourly}
                    theme={theme}
                    units={units}
                    daylight={daylight}
                  />
                </section>

                <div className="grid gap-4 md:grid-cols-2 sm:gap-5">
                  {insights.length > 0 && <InsightsCard insights={insights} />}
                  {activities.length > 0 && <ActivityCard scores={activities} />}
                </div>

                <div className="grid gap-4 md:grid-cols-2 sm:gap-5">
                  <SunMoonCard
                    weather={currentWeather}
                    daylight={daylight}
                    theme={theme}
                  />
                  {airQuality && <AirQualityCard air={airQuality} />}
                </div>

                {dailyForecast.length > 0 && (
                  <Panel
                    title="Day by day"
                    subtitle={`Next ${dailyForecast.length} days — tap a row for details`}
                    icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
                  >
                    <WeeklyForecast
                      forecast={dailyForecast}
                      tz={currentWeather.timezone}
                      units={units}
                      theme={theme}
                    />
                  </Panel>
                )}

                <p className="px-1 text-center text-xs text-white/60">
                  Data from OpenWeather · refreshes automatically every 10
                  minutes · press{" "}
                  <kbd className="rounded border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-[0.65rem]">
                    /
                  </kbd>{" "}
                  to search
                </p>
              </>
            )}

            {!currentWeather && !isLoading && (
              <section className="glass animate-rise rounded-3xl p-6 text-center text-slate-800 sm:p-10 dark:text-slate-100">
                <Sparkles
                  className="mx-auto h-8 w-8 text-sky-500"
                  aria-hidden="true"
                />
                <h2 className="font-display mt-3 text-xl font-bold sm:text-2xl">
                  Let&apos;s find your weather
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                  Search for any city or share your location to see live
                  conditions, an interactive temperature trend, air quality and a
                  five-day outlook.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-pop fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-2xl backdrop-blur-md dark:bg-white/90 dark:text-slate-900"
        >
          {toast}
        </div>
      )}
    </>
  );
}

/** A titled glass panel; kept local since only the home page uses this shape. */
function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass animate-rise rounded-3xl p-4 text-slate-800 sm:p-6 dark:text-slate-100">
      <header className="mb-3.5 flex items-center gap-2.5">
        {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
