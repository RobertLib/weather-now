"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, Search, X } from "lucide-react";
import { GeoLocation } from "@/types/weather";
import { searchLocations } from "@/lib/weather";
import { matchCities } from "@/lib/cities";

/** Coordinates rounded to ~1 km, used to dedupe local and API suggestions. */
function locationKey(location: GeoLocation): string {
  return `${location.lat.toFixed(2)},${location.lon.toFixed(2)}`;
}

/** Local hits first, then any API results we don't already have. */
function mergeSuggestions(
  local: GeoLocation[],
  remote: GeoLocation[],
  limit = 6
): GeoLocation[] {
  const seen = new Set(local.map(locationKey));
  const merged = [...local];
  for (const location of remote) {
    const key = locationKey(location);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(location);
  }
  return merged.slice(0, limit);
}

const POPULAR = [
  "Prague",
  "London",
  "New York",
  "Tokyo",
  "Barcelona",
  "Reykjavík",
  "Sydney",
];

interface SearchBarProps {
  onSelectLocation: (location: GeoLocation) => void;
  onSearchText: (city: string) => void;
  onLocationSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({
  onSelectLocation,
  onSearchText,
  onLocationSearch,
  isLoading,
}: SearchBarProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // Local index answers instantly; the API fills in everything else.
  const localMatches = useMemo(() => matchCities(query, 4), [query]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let stale = false;
    setSuggestions(localMatches);
    setHighlight(-1);
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(term);
        if (!stale) setSuggestions(mergeSuggestions(localMatches, results));
      } catch {
        if (!stale) setSuggestions(localMatches);
      } finally {
        if (!stale) setSearching(false);
      }
    }, 280);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, localMatches]);

  // Close the dropdown when clicking elsewhere.
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
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const pick = (location: GeoLocation) => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.blur();
    onSelectLocation(location);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (highlight >= 0 && suggestions[highlight]) {
      pick(suggestions[highlight]);
      return;
    }
    if (query.trim()) {
      if (suggestions.length) {
        pick(suggestions[0]);
      } else {
        onSearchText(query.trim());
        setOpen(false);
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    }
  };

  const showSuggestions = open && query.trim().length >= 2;
  const showPopular = open && query.trim().length < 2;

  return (
    <div ref={wrapperRef} className="relative">
      <form
        onSubmit={submit}
        className="glass flex flex-col gap-2.5 rounded-3xl p-2.5 sm:flex-row sm:items-center"
        role="search"
        aria-label="Weather search"
      >
        <div className="relative flex-1">
          <label htmlFor="city-search" className="sr-only">
            Search for a city to get its weather
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
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search any city…"
            className="w-full rounded-2xl border border-transparent bg-white/60 py-2.5 pr-9 pl-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400/60 focus:bg-white focus:ring-2 focus:ring-sky-400/30 sm:text-base dark:bg-white/10 dark:text-slate-100 dark:focus:bg-white/15"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-900/10 hover:text-slate-600 dark:hover:bg-white/10"
              aria-label="Clear search"
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
            disabled={isLoading || !query.trim()}
            className="flex-1 rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
          >
            {isLoading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Search"
            )}
          </button>
          <button
            type="button"
            onClick={onLocationSearch}
            disabled={isLoading}
            className="grid w-11 place-items-center rounded-2xl border border-slate-900/10 bg-white/60 text-slate-600 transition-all hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            aria-label="Use my current location"
            title="Use my current location"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {(showSuggestions || showPopular) && (
        <div
          id={listId}
          role="listbox"
          aria-label="City suggestions"
          className="glass animate-pop absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-2xl"
        >
          {showPopular && (
            <>
              <p className="px-2.5 py-1.5 text-[0.65rem] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Popular right now
              </p>
              {POPULAR.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSearchText(name);
                  }}
                  className="block w-full rounded-xl px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-sky-500/15 dark:text-slate-200"
                >
                  {name}
                </button>
              ))}
            </>
          )}

          {showSuggestions &&
            (suggestions.length ? (
              suggestions.map((location, index) => (
                <button
                  key={`${location.lat}-${location.lon}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onPointerEnter={() => setHighlight(index)}
                  onClick={() => pick(location)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    index === highlight
                      ? "bg-sky-500/20"
                      : "hover:bg-sky-500/10"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {location.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {[location.state, location.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[0.65rem] text-slate-400">
                    {location.lat.toFixed(1)}°, {location.lon.toFixed(1)}°
                  </span>
                </button>
              ))
            ) : (
              <p className="px-2.5 py-3 text-sm text-slate-500 dark:text-slate-400">
                {searching
                  ? "Searching…"
                  : "No match yet — keep typing the full city name."}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
