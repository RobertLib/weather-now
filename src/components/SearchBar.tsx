"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LocateFixed, Search, X } from "lucide-react";
import { GeoLocation } from "@/types/weather";
import { searchLocations } from "@/lib/openmeteo";
import {
  IndexPlace,
  PlaceIndex,
  indexCountryName,
  indexPlaceName,
  indexPlacePath,
  loadPlaceIndex,
  matchPlaces,
} from "@/lib/places-client";
import { resolvePlaceHref } from "@/lib/navigation-client";
import { POPULAR } from "@/lib/popular";
import { useI18n } from "@/i18n/client";
import ErrorMessage from "./ErrorMessage";

/** One row in the dropdown: a curated city (with its page) or a geocoder hit. */
interface Suggestion {
  key: string;
  name: string;
  detail: string;
  lat: number;
  lon: number;
  href?: string;
  geo?: GeoLocation;
}

/** How many popular places the empty search box offers. */
const POPULAR_SHOWN = 6;

interface SearchBarProps {
  autoFocus?: boolean;
  /** Surfaces geolocation failures to the page; shown under the box otherwise. */
  onError?: (message: string) => void;
}

export default function SearchBar({ autoFocus = false, onError }: SearchBarProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [remote, setRemote] = useState<{ term: string; results: GeoLocation[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const reportGeoError = (message: string) => (onError ? onError(message) : setGeoError(message));

  const term = query.trim();
  const searchable = term.length >= 2;

  const ensureIndex = () => {
    if (!index) loadPlaceIndex().then(setIndex).catch(() => {});
  };

  const fromIndex = (p: IndexPlace, idx: PlaceIndex): Suggestion => ({
    key: `p${p[0]}`,
    name: indexPlaceName(p, locale),
    detail: indexCountryName(idx, p[1], locale),
    lat: p[6],
    lon: p[7],
    href: indexPlacePath(idx, p, locale),
  });

  const local = useMemo(
    () => (index && searchable ? matchPlaces(index, term, 4).map((p) => fromIndex(p, index)) : []),
    // fromIndex only depends on locale, which is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, term, searchable]
  );
  const remoteResults = remote?.term === term ? remote.results : null;
  const searching = searchable && remoteResults === null;

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!searchable) return [];
    const merged = [...local];
    const seen = new Set(local.map((s) => `${s.lat.toFixed(1)},${s.lon.toFixed(1)}`));
    for (const r of remoteResults ?? []) {
      const key = `${r.lat.toFixed(1)},${r.lon.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        key: `g${r.id ?? key}`,
        name: r.name,
        detail: [r.admin1, r.country].filter(Boolean).join(", "),
        lat: r.lat,
        lon: r.lon,
        geo: r,
      });
    }
    return merged.slice(0, 6);
  }, [searchable, local, remoteResults]);

  const popular = useMemo(() => {
    if (!index) return [];
    return POPULAR[locale].slice(0, POPULAR_SHOWN).flatMap(([cc, slug]) => {
      const p = index.places.find((x) => x[1] === cc && x[4] === slug);
      return p ? [fromIndex(p, index)] : [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (term.length < 2) return;
    let stale = false;
    const timer = setTimeout(async () => {
      let results: GeoLocation[] = [];
      try {
        results = await searchLocations(term, locale);
      } catch {
        /* local matches only */
      }
      if (!stale) setRemote({ term, results });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [term, locale]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // "/" focuses the search box from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = async (s: Suggestion) => {
    setQuery("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    setBusy(true);
    const href =
      s.href ??
      (await resolvePlaceHref(locale, {
        id: s.geo?.id,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        cc: s.geo?.cc,
      }));
    router.push(href);
    setBusy(false);
  };

  const locate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      reportGeoError(t.errors.geoUnsupported);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const href = await resolvePlaceHref(locale, {
          lat: coords.latitude,
          lon: coords.longitude,
          name: t.search.yourLocation,
        });
        router.push(href);
        setBusy(false);
      },
      () => {
        reportGeoError(t.errors.geoFailed);
        setBusy(false);
      },
      { timeout: 10_000 }
    );
  };

  const showSuggestions = open && searchable;
  const showPopular = open && !searchable && popular.length > 0;
  // Whichever list the dropdown shows; arrow keys and Enter work on both.
  const list = searchable ? suggestions : popular;
  const active = open && highlight >= 0 && highlight < list.length ? highlight : -1;
  const optionId = (i: number) => `${listId}-option-${i}`;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const pick = suggestions[active] ?? suggestions[0];
    if (pick) go(pick);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" && active >= 0) {
      // Also covers the popular list, where the submit button is disabled.
      event.preventDefault();
      go(list[active]);
      return;
    }
    if (!list.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1 >= list.length ? 0 : h + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h <= 0 || h >= list.length ? list.length - 1 : h - 1));
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form
        onSubmit={submit}
        className="glass flex flex-col gap-2.5 rounded-3xl p-2.5 sm:flex-row sm:items-center"
        role="search"
        aria-label={t.search.aria}
      >
        <div className="relative flex-1">
          <label htmlFor="city-search" className="sr-only">
            {t.search.label}
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="city-search"
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlight(-1);
              setOpen(true);
              ensureIndex();
            }}
            onFocus={() => {
              setOpen(true);
              setHighlight(-1);
              ensureIndex();
            }}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            className="w-full rounded-2xl border border-transparent bg-white/60 py-2.5 pr-9 pl-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400/60 focus:bg-white focus:ring-2 focus:ring-sky-400/30 sm:text-base dark:bg-white/10 dark:text-slate-100 dark:focus:bg-white/15"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions || showPopular}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-900/10 hover:text-slate-600 dark:hover:bg-white/10"
              aria-label={t.search.clear}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {searching && (
            <Loader2
              className="absolute top-1/2 right-9 h-4 w-4 -translate-y-1/2 animate-spin text-sky-500"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            type="submit"
            disabled={busy || !suggestions.length}
            className="flex-1 rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
          >
            {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" /> : t.search.submit}
          </button>
          <button
            type="button"
            onClick={locate}
            disabled={busy}
            className="grid w-11 place-items-center rounded-2xl border border-slate-900/10 bg-white/60 text-slate-600 transition-all hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            aria-label={t.search.locate}
            title={t.search.locate}
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {geoError && (
        <div className="mt-2">
          <ErrorMessage message={geoError} onClose={() => setGeoError(null)} />
        </div>
      )}

      {(showSuggestions || showPopular) && (
        <div className="glass animate-pop absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-2xl">
          {showPopular && (
            <p
              id={`${listId}-label`}
              className="px-2.5 py-1.5 text-[0.65rem] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400"
            >
              {t.search.popular}
            </p>
          )}

          {list.length > 0 ? (
            <div
              id={listId}
              role="listbox"
              aria-labelledby={showPopular ? `${listId}-label` : undefined}
              aria-label={showPopular ? undefined : t.search.suggestions}
            >
              {list.map((s, i) => (
                // Focus stays in the input (combobox pattern), so options
                // aren't tab stops; arrow keys move `aria-activedescendant`.
                <button
                  key={s.key}
                  id={optionId(i)}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === active}
                  onPointerEnter={() => setHighlight(i)}
                  onClick={() => go(s)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    i === active ? "bg-sky-500/20" : "hover:bg-sky-500/10"
                  }`}
                >
                  {showPopular ? (
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {s.name}
                      <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">{s.detail}</span>
                    </span>
                  ) : (
                    <>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {s.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {s.detail}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-[0.65rem] text-slate-400">
                        {s.lat.toFixed(1)}°, {s.lon.toFixed(1)}°
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p role="status" className="px-2.5 py-3 text-sm text-slate-500 dark:text-slate-400">
              {searching ? t.search.searching : t.search.noMatch}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
