"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { PlaceRef } from "@/types/weather";
import { searchLocations } from "@/lib/openmeteo";
import { resolvePlaceHref } from "@/lib/navigation-client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/client";
import SearchBar from "@/components/SearchBar";
import FavoritesBar from "@/components/FavoritesBar";
import WeatherDashboard, { LAST_PLACE_KEY } from "@/components/WeatherDashboard";
import WeatherSkeleton from "@/components/WeatherSkeleton";
import ErrorMessage from "@/components/ErrorMessage";

type State = { status: "resolving" } | { status: "ready"; place: PlaceRef } | { status: "empty" };

/**
 * The homepage's personal part: search, saved places and a live dashboard for
 * the visitor's own place — from the URL, their last visit, or an IP guess.
 */
export default function HomeClient() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [last, , hydrated] = useLocalStorage<PlaceRef | null>(LAST_PLACE_KEY, null);
  const [state, setState] = useState<State>({ status: "resolving" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const settle = (next: State) => !cancelled && setState(next);

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const lat = Number(params.get("lat"));
      const lon = Number(params.get("lon"));
      const q = params.get("q");

      if (params.has("lat") && Number.isFinite(lat) && Number.isFinite(lon)) {
        return settle({
          status: "ready",
          place: { name: params.get("name") || t.search.yourLocation, cc: params.get("cc") ?? "", lat, lon },
        });
      }

      // Old shareable links (`/?q=Prague`) move to the city's own page.
      if (q) {
        try {
          const [hit] = await searchLocations(q, locale, 1);
          if (hit) {
            const href = await resolvePlaceHref(locale, hit);
            if (!cancelled) router.replace(href);
            return;
          }
        } catch {
          /* fall through to the usual guess */
        }
      }

      if (last) return settle({ status: "ready", place: last });

      try {
        const res = await fetch(`/api/locate?lang=${locale}`);
        const guess = (await res.json()) as {
          found: boolean;
          name?: string | null;
          cc?: string;
          lat?: number;
          lon?: number;
          path?: string;
        };
        if (guess.found && guess.lat !== undefined && guess.lon !== undefined) {
          return settle({
            status: "ready",
            place: {
              name: guess.name || t.search.yourLocation,
              cc: guess.cc ?? "",
              lat: guess.lat,
              lon: guess.lon,
              path: guess.path,
            },
          });
        }
      } catch {
        /* no guess available (local dev, blocked request) */
      }
      settle({ status: "empty" });
    })();

    return () => {
      cancelled = true;
    };
    // Resolve once, as soon as stored preferences are readable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <SearchBar onError={setError} />
      <FavoritesBar />
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {state.status === "resolving" && <WeatherSkeleton label={t.home.locating} />}

      {state.status === "ready" && (
        <section aria-label={t.home.yourWeather} className="space-y-3">
          {state.place.path && (
            <p className="flex justify-end">
              <Link
                href={state.place.path}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25"
              >
                {t.home.openFull(state.place.name)}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </p>
          )}
          <WeatherDashboard key={`${state.place.lat},${state.place.lon}`} place={state.place} />
        </section>
      )}

      {state.status === "empty" && (
        <section className="glass animate-rise rounded-3xl p-6 text-center text-slate-800 sm:p-10 dark:text-slate-100">
          <Sparkles className="mx-auto h-8 w-8 text-sky-500" aria-hidden="true" />
          <h2 className="font-display mt-3 text-xl font-bold sm:text-2xl">{t.home.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{t.home.emptyText}</p>
        </section>
      )}
    </div>
  );
}
