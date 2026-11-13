"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, LineChart } from "lucide-react";
import { AirQuality, Forecast, PlaceRef } from "@/types/weather";
import {
  WeatherApiError,
  fetchAirQuality,
  fetchForecast,
  upcomingDays,
  upcomingHours,
} from "@/lib/openmeteo";
import { conditionKind, skyTheme } from "@/lib/conditions";
import { formatSpeed, formatTemp, formatTempDelta } from "@/lib/units";
import { daylightInfo } from "@/lib/astro";
import { formatHour } from "@/lib/datetime";
import { activityScores, buildInsights } from "@/lib/insights";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNow } from "@/hooks/useNow";
import { useUnits } from "@/hooks/useUnits";
import { useI18n } from "@/i18n/client";
import { Dictionary, describe } from "@/i18n";
import WeatherBackground from "./WeatherBackground";
import CurrentWeatherCard from "./CurrentWeatherCard";
import HighlightsGrid from "./HighlightsGrid";
import HourlyForecast from "./HourlyForecast";
import TempChart from "./TempChart";
import WeeklyForecast from "./WeeklyForecast";
import SunMoonCard from "./SunMoonCard";
import AirQualityCard from "./AirQualityCard";
import InsightsCard from "./InsightsCard";
import ActivityCard from "./ActivityCard";
import WeatherSkeleton from "./WeatherSkeleton";
import ErrorMessage from "./ErrorMessage";
import Panel from "./Panel";
import { favoriteId } from "@/lib/favorites";
import { MAX_FAVORITES, useFavorites } from "./FavoritesBar";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
/** Server-rendered data older than this is refreshed right after hydration. */
const STALE_AFTER_MS = 15 * 60 * 1000;

export const LAST_PLACE_KEY = "weathernow:last";

function errorMessage(t: Dictionary, error: unknown): string {
  if (error instanceof WeatherApiError && error.status === 429) return t.errors.rateLimited;
  if (typeof navigator !== "undefined" && !navigator.onLine) return t.errors.offline;
  return t.errors.generic;
}

interface WeatherDashboardProps {
  place: PlaceRef;
  initialForecast?: Forecast | null;
  initialAir?: AirQuality | null;
  /** Paint the sky backdrop from the current conditions. */
  paintBackground?: boolean;
}

/**
 * The live forecast view. Renders server-provided data immediately (so the
 * HTML is complete for visitors and crawlers alike), then keeps itself fresh
 * by calling Open-Meteo straight from the browser.
 */
export default function WeatherDashboard({
  place,
  initialForecast = null,
  initialAir = null,
  paintBackground = true,
}: WeatherDashboardProps) {
  const { t, locale } = useI18n();
  const [units] = useUnits();
  const now = useNow();

  const [forecast, setForecast] = useState<Forecast | null>(initialForecast);
  const [air, setAir] = useState<AirQuality | null>(initialAir);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [favorites, setFavorites] = useFavorites();
  const [, setLastPlace] = useLocalStorage<PlaceRef | null>(LAST_PLACE_KEY, null);
  const placeRef = useRef(place);
  /** Bumped by every load, so a slow older response can't overwrite a newer one. */
  const requestRef = useRef(0);
  const loadingRef = useRef(false);
  const fetchedAtRef = useRef(initialForecast?.fetchedAt ?? 0);

  const load = useCallback(async () => {
    const { lat, lon } = placeRef.current;
    const request = ++requestRef.current;
    const isLatest = () => request === requestRef.current;
    loadingRef.current = true;
    setIsRefreshing(true);
    setError(null);
    try {
      const next = await fetchForecast(lat, lon);
      if (!isLatest()) return;
      fetchedAtRef.current = next.fetchedAt;
      setForecast(next);
      fetchAirQuality(lat, lon)
        .then((nextAir) => {
          if (isLatest()) setAir(nextAir);
        })
        .catch(() => {
          /* air quality is a bonus panel */
        });
    } catch (err) {
      if (isLatest()) setError(errorMessage(t, err));
    } finally {
      if (isLatest()) {
        loadingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, [t]);

  // Fetch when there's no server data, or when it's gone stale.
  useEffect(() => {
    if (!initialForecast || Date.now() - initialForecast.fetchedAt > STALE_AFTER_MS) {
      // Fetching on mount is the point of this effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remember this place so the homepage can open with it next time.
  useEffect(() => {
    setLastPlace(place);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.lat, place.lon, place.name]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // The interval skips hidden tabs, so a tab (or installed app) brought back
  // after hours would show old data for up to ten minutes. Refresh on return
  // instead — also after a back/forward-cache restore or a lost connection.
  useEffect(() => {
    const refreshIfStale = () => {
      if (
        !loadingRef.current &&
        document.visibilityState === "visible" &&
        Date.now() - fetchedAtRef.current > REFRESH_INTERVAL_MS
      ) {
        load();
      }
    };
    // `pageshow` also fires on every ordinary load; only a cache restore counts.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refreshIfStale();
    };
    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", refreshIfStale);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const clock = now || forecast?.fetchedAt || 0;
  const hourly = useMemo(
    () => (forecast ? upcomingHours(forecast, 48, clock) : []),
    [forecast, clock]
  );
  const days = useMemo(() => (forecast ? upcomingDays(forecast, clock) : []), [forecast, clock]);
  const today = days[0];

  const theme = useMemo(
    () =>
      forecast
        ? skyTheme(conditionKind(forecast.current.code), !forecast.current.isDay)
        : skyTheme("partly", false),
    [forecast]
  );

  const daylight = useMemo(
    () =>
      forecast && today
        ? daylightInfo(Math.floor(clock / 1000) || forecast.current.time, today)
        : null,
    [forecast, today, clock]
  );

  const insights = useMemo(
    () =>
      forecast && hourly.length
        ? buildInsights(
            t,
            forecast.current,
            hourly,
            today,
            forecast.timezone,
            {
              hour: (unix) => formatHour(unix, forecast.timezone, locale),
              temp: (c) => formatTemp(c, units),
              tempDelta: (c) => formatTempDelta(c, units),
              speed: (ms) => formatSpeed(ms, units),
            }
          )
        : [],
    [forecast, hourly, today, t, locale, units]
  );

  const activities = useMemo(
    () => (forecast && hourly.length ? activityScores(forecast.current, hourly) : []),
    [forecast, hourly]
  );

  const activeId = favoriteId(place.lat, place.lon);
  const isFavorite = favorites.some((c) => c.id === activeId);

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites((list) => list.filter((c) => c.id !== activeId));
      setToast(t.favorites.removed(place.name));
      return;
    }
    if (favorites.length >= MAX_FAVORITES) {
      setToast(t.favorites.limit(MAX_FAVORITES));
      return;
    }
    setFavorites((list) => [
      ...list,
      {
        id: activeId,
        name: place.name,
        cc: place.cc,
        lat: place.lat,
        lon: place.lon,
        path: place.path,
        i18n: place.i18n,
      },
    ]);
    setToast(t.favorites.saved(place.name));
  };

  const share = async () => {
    if (!forecast) return;
    const text = t.current.shareText(
      place.name,
      formatTemp(forecast.current.temp, units),
      describe(t, forecast.current.code)
    );
    const url = place.path ? new URL(place.path, window.location.origin).href : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "WeatherNow", text, url });
        return;
      } catch (err) {
        // Closing the share sheet is a choice, not a failure — don't copy instead.
        if (err instanceof DOMException && err.name === "AbortError") return;
        /* share unavailable here (e.g. not allowed) — fall back to the clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} — ${url}`);
      setToast(t.current.copied);
    } catch {
      setToast(t.current.copyFailed);
    }
  };

  return (
    <>
      {paintBackground && <WeatherBackground theme={theme} />}

      <div className="space-y-4 sm:space-y-5">
        {error && <ErrorMessage message={error} onClose={() => setError(null)} onRetry={load} />}

        {!forecast && !error && <WeatherSkeleton label={t.common.loading} />}

        {forecast && (
          <>
            <CurrentWeatherCard
              name={place.name}
              countryName={place.countryName}
              current={forecast.current}
              tz={forecast.timezone}
              today={today}
              theme={theme}
              units={units}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onRefresh={load}
              onShare={share}
              lastUpdated={forecast.fetchedAt}
              isRefreshing={isRefreshing}
              now={now}
            />

            {hourly.length > 0 && (
              <Panel
                title={t.hourly.title}
                subtitle={t.hourly.subtitle}
                icon={<Clock className="h-4 w-4" aria-hidden="true" />}
              >
                <HourlyForecast
                  items={hourly.slice(0, 24)}
                  tz={forecast.timezone}
                  units={units}
                  theme={theme}
                  now={now}
                />
              </Panel>
            )}

            {hourly.length > 1 && (
              <Panel
                title={t.chart.title}
                subtitle={t.chart.subtitle}
                icon={<LineChart className="h-4 w-4" aria-hidden="true" />}
              >
                <TempChart items={hourly} tz={forecast.timezone} units={units} theme={theme} step={3} />
              </Panel>
            )}

            <section aria-label={t.highlights.aria}>
              <HighlightsGrid
                current={forecast.current}
                hourly={hourly}
                theme={theme}
                units={units}
                uvMax={today?.uvMax ?? null}
              />
            </section>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {insights.length > 0 && <InsightsCard insights={insights} />}
              {activities.length > 0 && <ActivityCard scores={activities} />}
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {today && daylight && (
                <SunMoonCard
                  sunrise={today.sunrise}
                  sunset={today.sunset}
                  time={forecast.current.time}
                  tz={forecast.timezone}
                  daylight={daylight}
                  theme={theme}
                  southern={forecast.lat < 0}
                />
              )}
              {air && <AirQualityCard air={air} />}
            </div>

            {days.length > 0 && (
              <Panel
                title={t.daily.title}
                subtitle={t.daily.subtitle(days.length)}
                icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
              >
                <WeeklyForecast
                  days={days}
                  hourly={forecast.hourly}
                  tz={forecast.timezone}
                  units={units}
                  theme={theme}
                />
              </Panel>
            )}

            <p className="px-1 text-center text-xs text-white/60">
              {t.dashboard.footnote}{" "}
              <kbd className="rounded border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-[0.65rem]">
                /
              </kbd>{" "}
              {t.dashboard.footnoteKey}
            </p>
          </>
        )}
      </div>

      {/* The live region stays mounted: screen readers announce changes to an
          existing region, not regions that appear together with their text. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2"
      >
        {toast && (
          <div className="animate-pop rounded-full bg-slate-900/90 px-4 py-2 text-center text-sm font-medium text-white shadow-2xl backdrop-blur-md dark:bg-white/90 dark:text-slate-900">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
