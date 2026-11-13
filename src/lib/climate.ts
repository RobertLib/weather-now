// The dataset is ~260 kB; a client import would ship all of it to browsers.
import "server-only";
import climateData from "@/data/climate.json";
import { PLACES } from "@/lib/places";

/** Monthly normals. °C, mm, hours. Optional fields depend on the source. */
export interface MonthNormals {
  /** Mean daily maximum. */
  hi: number;
  /** Mean daily minimum. */
  lo: number;
  /** Mean monthly precipitation total. */
  p: number;
  /** Mean days with ≥ 1 mm. */
  pd?: number;
  /** Mean daily sunshine hours. */
  sun?: number;
  /** Mean days with snowfall. */
  sd?: number;
  /** Highest daily maximum on record in the period. */
  rhi?: number;
  /** Lowest daily minimum on record in the period. */
  rlo?: number;
}

interface ClimateFile {
  source: string;
  sourceUrl: string;
  license: string;
  period: string;
  sources?: Record<string, string>;
  /** Places whose precipitation comes from another provider than `sources`. */
  precipSources?: Record<string, string>;
  /**
   * Where each place's temperature normals come from: `meteostat:<station>`
   * or `power:<lat>,<lon>` (grid cell). Places sharing an origin share numbers.
   */
  origins?: Record<string, string>;
  data: Record<string, MonthNormals[]>;
}

const CLIMATE = climateData as unknown as ClimateFile;

export interface ClimateProvider {
  id: string;
  name: string;
  url: string;
  license: string;
}

/** Known upstream sources, keyed by the ids used in `climate.json#sources`. */
const PROVIDERS: Record<string, ClimateProvider> = {
  meteostat: {
    id: "meteostat",
    name: "Meteostat",
    url: "https://meteostat.net/",
    license: "CC BY-NC 4.0",
  },
  power: {
    id: "power",
    name: "NASA POWER",
    url: "https://power.larc.nasa.gov/",
    license: "Public domain",
  },
};

const FALLBACK: ClimateProvider = {
  id: "climate",
  name: CLIMATE.source.split(/[;(]/)[0].trim() || "Climate normals",
  url: CLIMATE.sourceUrl.split(/\s*;\s*/)[0],
  license: CLIMATE.license,
};

/** Providers actually used in the dataset, for the footer credit. */
export const CLIMATE_PROVIDERS: ClimateProvider[] = (() => {
  const ids = new Set(Object.values(CLIMATE.sources ?? {}));
  const list = [...ids].map((id) => PROVIDERS[id]).filter(Boolean);
  return list.length ? list : [FALLBACK];
})();

export const CLIMATE_PERIOD = CLIMATE.period;

/** Which source the normals of one place come from. */
export function climateProvider(placeId: number): ClimateProvider {
  const id = CLIMATE.sources?.[String(placeId)];
  return (id && PROVIDERS[id]) || FALLBACK;
}

/**
 * Places whose normals share an origin (a station or a grid cell) with a more
 * populous place. Their climate pages would repeat that place's numbers, so
 * they stay available but are `noindex` and left out of the sitemap.
 */
const SECONDARY_CLIMATE: Set<number> = (() => {
  const seen = new Set<string>();
  const secondary = new Set<number>();
  // PLACES is sorted by population, largest first.
  for (const place of PLACES) {
    const origin = CLIMATE.origins?.[String(place.id)];
    if (!origin) continue;
    if (seen.has(origin)) secondary.add(place.id);
    else seen.add(origin);
  }
  return secondary;
})();

/** Whether a place's climate pages should be indexed (see `SECONDARY_CLIMATE`). */
export function isClimateIndexed(placeId: number): boolean {
  return !SECONDARY_CLIMATE.has(placeId);
}

/** One provider of a place's normals and what it supplies. */
export interface ClimateCredit {
  provider: ClimateProvider;
  /** Set when temperatures and precipitation come from different providers. */
  part?: "temperature" | "precipitation";
}

/**
 * Who to credit on a place's climate pages: the temperature provider and,
 * when the station had no complete precipitation record, the provider that
 * filled it in.
 */
export function climateCredits(placeId: number): ClimateCredit[] {
  const main = climateProvider(placeId);
  const precipId = CLIMATE.precipSources?.[String(placeId)];
  const precip = precipId ? PROVIDERS[precipId] : undefined;
  return precip && precip.id !== main.id
    ? [
        { provider: main, part: "temperature" },
        { provider: precip, part: "precipitation" },
      ]
    : [{ provider: main }];
}

export function getClimate(placeId: number): MonthNormals[] | null {
  const months = CLIMATE.data[String(placeId)];
  return months && months.length === 12 ? months : null;
}

const MAX_ESTIMATED_WET_DAYS = 28;

/** Rough "nice to be outside" score, 0-100, for travel advice. */
export function monthComfort(m: MonthNormals): number {
  let score = 100 - Math.abs(m.hi - 23) * 4.5;
  if (m.hi > 30) score -= (m.hi - 30) * 4;
  // Without measured rain days, ~9 mm per wet day is a rough average; capped
  // because monsoon totals (Mumbai: 800+ mm in July) would otherwise imply
  // more wet days than the month has.
  const wetDays = m.pd ?? Math.min(MAX_ESTIMATED_WET_DAYS, m.p / 9);
  score -= wetDays * 2.2;
  if (m.sun !== undefined) score += (m.sun - 6) * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type Verdict = "great" | "good" | "fair" | "poor";

export function verdict(score: number): Verdict {
  if (score >= 70) return "great";
  if (score >= 50) return "good";
  if (score >= 30) return "fair";
  return "poor";
}

export interface ClimateFacts {
  warmest: number;
  coldest: number;
  wettest: number;
  driest: number;
  sunniest: number | null;
  /** Up to three best months for visiting, in calendar order. */
  best: number[];
  annualPrecip: number;
  annualMean: number;
  /** Months where the mean minimum is below freezing. */
  frostMonths: number[];
}

export function climateFacts(months: MonthNormals[]): ClimateFacts {
  const idx = (pick: (m: MonthNormals) => number, dir: 1 | -1) =>
    months.reduce((best, m, i) => (pick(m) * dir > pick(months[best]) * dir ? i : best), 0);
  const hasSun = months.every((m) => m.sun !== undefined);
  const ranked = months
    .map((m, i) => ({ i, score: monthComfort(m) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0].score;
  const best = ranked
    .filter((r) => r.score >= top - 8)
    .slice(0, 3)
    .map((r) => r.i)
    .sort((a, b) => a - b);

  return {
    warmest: idx((m) => m.hi, 1),
    coldest: idx((m) => m.lo, -1),
    wettest: idx((m) => m.p, 1),
    driest: idx((m) => m.p, -1),
    sunniest: hasSun ? idx((m) => m.sun ?? 0, 1) : null,
    best,
    annualPrecip: months.reduce((s, m) => s + m.p, 0),
    annualMean: months.reduce((s, m) => s + (m.hi + m.lo) / 2, 0) / 12,
    frostMonths: months.flatMap((m, i) => (m.lo < 0 ? [i] : [])),
  };
}
