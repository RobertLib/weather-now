"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { PlaceLabels, PlaceRef } from "@/types/weather";
import { searchLocations } from "@/lib/openmeteo";
import { placeFromQuery, resolvePlaceHref } from "@/lib/navigation-client";
import { localizePlace } from "@/lib/places-client";
import { favoriteId } from "@/lib/favorites";
import { DEFAULT_THEME } from "@/lib/conditions";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n/client";
import SearchBar from "@/components/SearchBar";
import FavoritesBar from "@/components/FavoritesBar";
import WeatherDashboard, { LAST_PLACE_KEY } from "@/components/WeatherDashboard";
import WeatherSkeleton from "@/components/WeatherSkeleton";
import WeatherBackground from "@/components/WeatherBackground";
import ErrorMessage from "@/components/ErrorMessage";

type State = { status: "resolving" } | { status: "ready"; place: PlaceRef } | { status: "empty" };

/**
 * The homepage's personal part: search, saved places and a live dashboard for
 * the visitor's own place — from the URL, their last visit, or an IP guess.
 */
export default function HomeClient() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  // The place the dashboard shows, so the saved-places strip can highlight it.
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* The dashboard paints the sky from the conditions once it shows a
          place; until then (and in the static HTML) the neutral sky. */}
      {activeId === null && <WeatherBackground theme={DEFAULT_THEME} />}
      <SearchBar onError={setError} />
      <FavoritesBar activeId={activeId} />
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {/* The dashboard depends on the query string, so it renders in the
          browser; everything else on the homepage stays static. */}
      <Suspense fallback={<WeatherSkeleton label={t.home.locating} />}>
        <HomeDashboard onPlace={setActiveId} />
      </Suspense>
    </div>
  );
}

function HomeDashboard({ onPlace }: { onPlace: (favoriteId: string | null) => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  // Search, favourites and geolocation all navigate to `/?lat=…&lon=…` without
  // remounting this component, so the place must follow the query string.
  const query = useSearchParams().toString();
  const [last, , hydrated] = useLocalStorage<PlaceRef | null>(LAST_PLACE_KEY, null);
  const [state, setState] = useState<State>({ status: "resolving" });

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const settle = (next: State) => {
      if (cancelled) return;
      setState(next);
      onPlace(next.status === "ready" ? favoriteId(next.place.lat, next.place.lon) : null);
    };

    (async () => {
      const params = new URLSearchParams(query);
      const linked = placeFromQuery(params);
      const q = params.get("q");

      if (linked) {
        return settle({
          status: "ready",
          place: { name: linked.name ?? t.search.yourLocation, cc: linked.cc ?? "", lat: linked.lat, lon: linked.lon },
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

      if (last) return settle({ status: "ready", place: localizePlace(last, locale) });

      try {
        const res = await fetch(`/api/locate?lang=${locale}`);
        const guess = (await res.json()) as {
          found: boolean;
          name?: string | null;
          cc?: string;
          lat?: number;
          lon?: number;
          path?: string;
          i18n?: PlaceLabels;
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
              i18n: guess.i18n,
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
    // Resolve once stored preferences are readable, then again whenever the
    // query string changes. `last` is left out on purpose: the dashboard
    // updates it on every visit, which must not trigger a new resolution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, query]);

  if (state.status === "resolving") return <WeatherSkeleton label={t.home.locating} />;

  if (state.status === "empty") {
    return (
      <section className="glass animate-rise rounded-3xl p-6 text-center text-slate-800 sm:p-10 dark:text-slate-100">
        <Sparkles className="mx-auto h-8 w-8 text-sky-500" aria-hidden="true" />
        <h2 className="font-display mt-3 text-xl font-bold sm:text-2xl">{t.home.emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{t.home.emptyText}</p>
      </section>
    );
  }

  return (
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
  );
}
