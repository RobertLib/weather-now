#!/usr/bin/env node
/**
 * Builds src/data/climate.json: monthly climate normals (1991–2020) for every
 * place in src/data/places.json.
 *
 * Primary source: a nearby Meteostat station (bulk.meteostat.net). Stations
 * qualify within MAX_DISTANCE_KM and MAX_ELEVATION_DIFF_M of the place; they are
 * ranked by distance plus weighted elevation difference, and the first one with
 * usable temperature normals wins. Its normals are:
 *   1. Meteostat's published 1991–2020 normals when tmin and tmax are complete, or
 *   2. normals computed here from the station's daily series (see dailyNormals),
 *      adjusted for missing years with NASA POWER (anomaly method).
 * Without such a station, a second pass accepts shorter daily records
 * (MIN_YEARS_SHORT_RECORD). Where POWER looks unrepresentative (see powerDoubt:
 * coastal cells that are partly sea, mountains the cell does not resolve), it
 * also accepts stations up to EXTENDED_DISTANCE_KM away and with larger
 * elevation differences. If that fails too, a last resort for those places
 * accepts even shorter records and farther stations in a similar setting (see
 * MIN_YEARS_LAST_RESORT). Station temperatures (and records) are shifted to the
 * place elevation with seasonal lapse rates (see lapseRate).
 *
 * The variables are chosen independently. Precipitation comes from the
 * temperature station when it is a regular candidate with a complete record,
 * otherwise from the next regular candidate that has one, otherwise from NASA
 * POWER. Sunshine comes from the temperature station, and rain days from the
 * precipitation station. Monthly records come from the temperature station's
 * daily series, when it is complete enough and consistent.
 *
 * Fallback: NASA POWER daily point data (MERRA-2 reanalysis, 0.5° × 0.625° grid,
 * 1991–2020) averaged per month and lapse-rate corrected from the grid-cell
 * elevation to the place elevation. POWER-only places where POWER looks
 * unrepresentative are reported. POWER is fetched for every place: it supplies
 * missing precipitation, is the reference for daily-derived normals and serves
 * as a cross-check.
 *
 * Output: `data` (12 × { hi, lo, p, pd?, sun?, rhi?, rlo? } per place id),
 * `sources` (provider of the temperatures: "meteostat" | "power"),
 * `precipSources` (only for places whose precipitation comes from the other
 * provider) and `origins`, which identifies where the temperature normals come
 * from ("meteostat:<station id>" or "power:<lat>,<lon>" of the grid-cell centre).
 * Places sharing an origin start from the same station or cell, but each is
 * lapse-corrected to its own elevation, and daily-derived normals are also
 * adjusted by each place's own POWER cell, so their numbers can still differ.
 *
 * Usage:
 *   DATA_CACHE_DIR=/path/to/cache node scripts/build-climate.mjs
 *   DATA_RETRY_404=1 node scripts/build-climate.mjs   # re-check cached 404s
 *
 * Downloads are cached in DATA_CACHE_DIR (default: <repo>/.cache/data, which is
 * git-ignored), so an interrupted run resumes and re-runs are offline.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.resolve(process.env.DATA_CACHE_DIR ?? path.join(ROOT, ".cache", "data"));
const PLACES_FILE = path.join(ROOT, "src", "data", "places.json");
const OUT_FILE = path.join(ROOT, "src", "data", "climate.json");

const METEOSTAT = "https://bulk.meteostat.net/v2";
const POWER = "https://power.larc.nasa.gov/api/temporal/daily/point";
const POWER_COMMUNITY = "AG";
const POWER_PARAMETERS = ["T2M_MAX", "T2M_MIN", "PRECTOTCORR"];
/** MERRA-2 grid of the POWER meteorology: cell centres at multiples of these steps from −90° / −180°. */
const POWER_GRID_LAT = 0.5;
const POWER_GRID_LON = 0.625;
/** Concurrent POWER downloads during the prefetch (request starts are still throttled). */
const POWER_CONCURRENCY = 2;

const PERIOD_START = 1991;
const PERIOD_END = 2020;
const YEARS = PERIOD_END - PERIOD_START + 1;

/* Station search ----------------------------------------------------------- */

const MAX_DISTANCE_KM = 40;
/** Radius of the second station pass where POWER looks unrepresentative (see powerDoubt). */
const EXTENDED_DISTANCE_KM = 100;
/** Station normals are lapse-corrected to the place elevation, so this can be generous. */
const MAX_ELEVATION_DIFF_M = 500;
/** Ranking: 100 m of elevation difference weighs like 5 km of distance. */
const ELEVATION_WEIGHT_KM_PER_M = 0.05;
const MAX_CANDIDATES = 6;

/* Normals from daily data -------------------------------------------------- */

/** A month-year counts when at most this many of its days lack the value (WMO rule for monthly means)… */
const MAX_MISSING_DAYS = 10;
/**
 * …and a monthly normal needs this many such years (of 30) in every month. Many
 * daily series are patchy in the 1990s, so the years present tend to be the
 * warmer recent ones. The mean of the available years is therefore adjusted by
 * how much the same years differ from the full period in POWER (anomaly method),
 * which allows shorter records. Without POWER, the stricter count applies.
 */
const MIN_YEARS_NORMAL = 15;
const MIN_YEARS_NORMAL_UNADJUSTED = 20;
/**
 * Before a place falls back to POWER, shorter temperature records are accepted
 * too (second pass). With the anomaly method such a normal is POWER plus the
 * station-minus-POWER difference over the years present, a difference that is
 * mostly systematic, so a few years pin it down.
 */
const MIN_YEARS_SHORT_RECORD = 5;
/**
 * Daily-derived normals are less vetted than the published ones, so they must
 * roughly agree with POWER (both at the place elevation): the monthly mean
 * temperature ((hi + lo) / 2, which survives POWER's squeezed range at coasts)
 * within MAX_TEMP_DISAGREEMENT_C, or MAX_TEMP_DISAGREEMENT_DOUBTFUL_C where POWER
 * looks unrepresentative (see powerDoubt; Agadir's inland cell runs ~7 °C hot in
 * summer), and the annual precipitation within a factor of MAX_PRECIP_RATIO
 * (daily precipitation is often undercounted when reports are missing).
 */
const MAX_TEMP_DISAGREEMENT_C = 5;
const MAX_TEMP_DISAGREEMENT_DOUBTFUL_C = 8;
const MAX_PRECIP_RATIO = 2;
/**
 * Published precipitation normals are trusted as they are (POWER is often far
 * off in the tropics: Yangon, Santo Domingo, Kathmandu), unless the station sits
 * more than this far above or below the place. Precipitation isn't
 * elevation-corrected, and orographic rain or a rain shadow can then double or
 * halve it (Port Louis took 1917 mm/yr from Vacoas, 420 m up on the plateau), so
 * such a station must also agree with POWER within MAX_PRECIP_RATIO.
 */
const MAX_PRECIP_ELEVATION_DIFF_M = 250;

/**
 * The second station pass (see placeClimate) extends to EXTENDED_DISTANCE_KM
 * when POWER looks unrepresentative:
 * - its annual mean daily range (hi − lo) is below MIN_POWER_RANGE_C, a sign of
 *   a grid cell that is partly sea, or
 * - the grid cell's mean elevation is TERRAIN_MISMATCH_M or more from the
 *   place's (mountains, where the coarse cell also runs cold in snowy winters).
 *   Here stations may differ by up to MAX_ELEVATION_DIFF_TERRAIN_M in elevation,
 *   since a lapse-corrected station beats a reanalysis cell that does not
 *   resolve the terrain.
 */
const MIN_POWER_RANGE_C = 5;
const TERRAIN_MISMATCH_M = 300;
const MAX_ELEVATION_DIFF_TERRAIN_M = 800;
/**
 * Last resort, only for places POWER cannot represent that the second pass could
 * not fix. It accepts records of MIN_YEARS_LAST_RESORT years, because the
 * anomaly method still captures the station-minus-POWER difference. It also
 * accepts stations up to LAST_RESORT_DISTANCE_KM away. Beyond
 * EXTENDED_DISTANCE_KM a station must share the place's setting:
 * - coastal place (squeezed POWER range): a low station (≤ SIMILAR_COAST_MAX_ELE_M)
 *   with Δh ≤ SIMILAR_COAST_MAX_DZ_M;
 * - mountain place: Δh ≤ SIMILAR_TERRAIN_MAX_DZ_M.
 */
const MIN_YEARS_LAST_RESORT = 3;
const LAST_RESORT_DISTANCE_KM = 150;
const SIMILAR_COAST_MAX_ELE_M = 100;
const SIMILAR_COAST_MAX_DZ_M = 100;
const SIMILAR_TERRAIN_MAX_DZ_M = 300;

/* Lapse rates -------------------------------------------------------------- */

/**
 * Approximate seasonal lapse rates (°C per km) of the mean daily maximum and
 * minimum, by calendar month for the northern mid-latitudes. In winter minima
 * change little with height, because cold air pools in valleys (inversions).
 * In summer both are close to the standard atmosphere's −6.5 °C/km.
 */
// prettier-ignore
const LAPSE_HI = [-5.0, -5.5, -6.2, -6.8, -7.0, -7.0, -6.9, -6.7, -6.3, -5.8, -5.3, -4.9];
// prettier-ignore
const LAPSE_LO = [-3.0, -3.4, -4.2, -4.9, -5.3, -5.5, -5.4, -5.2, -4.6, -4.0, -3.4, -3.0];

/**
 * Lapse rate in °C per metre for "hi" or "lo" in month `i` (0 = January) at
 * latitude `lat`. The southern hemisphere uses the table shifted by half a year.
 * Toward the equator, where there are no thermal seasons, the rate blends into
 * the annual mean: fully seasonal beyond 35°, annual mean within 15°.
 */
function lapseRate(kind, i, lat) {
  const table = kind === "hi" ? LAPSE_HI : LAPSE_LO;
  const annual = table.reduce((a, b) => a + b, 0) / 12;
  const seasonal = table[lat < 0 ? (i + 6) % 12 : i];
  const weight = Math.min(1, Math.max(0, (Math.abs(lat) - 15) / 20));
  return (annual + weight * (seasonal - annual)) / 1000;
}

/** Temperature change from `fromEle` to `toEle` (m) for "hi" or "lo" in month `i`. */
const lapseShift = (kind, i, lat, fromEle, toEle) => lapseRate(kind, i, lat) * (toEle - fromEle);

/* Record QC ---------------------------------------------------------------- */

/** Daily series: a month-year counts for rain days and records when this share of its days has data. */
const MONTH_COVERAGE = 0.9;
/** …and a derived statistic needs this many such years in every month. */
const MIN_YEARS_RAIN_DAYS = 10;
const MIN_YEARS_EXTREMES = 20;
/*
 * Station daily series contain bad values: tmin 4 °C in Singapore, "0"
 * placeholders, whole months of misfiled data. See loadDaily and robustExtreme.
 */
/** Daily mean vs mid-range of min/max: max gap before tmin / tmax is distrusted. */
const MAX_MIDRANGE_GAP_LOW_C = 5;
const MAX_MIDRANGE_GAP_HIGH_C = 10;
/** A value beyond both neighbouring days by more than this is a single-day spike. */
const SPIKE_C = 8;
/** Tail ratios; bad lows (zeros, lost minus signs) are far more common than bad highs. */
const TAIL_RATIO_HIGH = 1.5;
const TAIL_RATIO_LOW = 1.3;
const SPIKE_TAIL_RATIO = 1;
const MAX_TAIL_DROPS = 5;
/**
 * A month-year is a corrupted block when its mean tmax or tmin is further than
 * max(MAX_MONTH_ANOMALY_C, MONTH_ANOMALY_SIGMAS × robust σ) from the median of
 * that calendar month (e.g. Montreal McTavish, April 1995 recorded as midwinter).
 */
const MAX_MONTH_ANOMALY_C = 9;
const MONTH_ANOMALY_SIGMAS = 6;
/** Months without a trustworthy record a station may have before records are dropped entirely. */
const MAX_RECORD_GAPS = 2;

/** Stations whose data proved wrong on review; skipped. */
const BAD_STATIONS = new Set([]);

/** Per-host politeness: minimum spacing of request starts. */
const INTERVAL_MS = { "bulk.meteostat.net": 150, "power.larc.nasa.gov": 1000 };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Next free request slot per host; works for concurrent callers too. */
const nextSlot = new Map();
async function throttle(host) {
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, slot + (INTERVAL_MS[host] ?? 500));
  if (slot > now) await sleep(slot - now);
}

const inFlight = new Map();

/**
 * A 404 is cached as a `.404` marker so offline re-runs stay offline. Meteostat
 * answers 404 for stations without a file, which is permanent; a transient 404
 * would stick, though, so DATA_RETRY_404=1 asks again.
 */
const RETRY_404 = process.env.DATA_RETRY_404 === "1";

/**
 * Download `url` into the cache (gzip-compressed unless already .gz) and return
 * the decompressed text, or null for 404. Throttled per host and retried.
 * `valid(text)`, when given, vets a 200 response before it is cached: one that
 * fails is returned for this run but not stored, so the next run asks again.
 */
function cachedText(url, relativeFile, valid) {
  const file = path.join(CACHE_DIR, relativeFile);
  if (!inFlight.has(file)) {
    inFlight.set(file, fetchCached(url, file, valid).finally(() => inFlight.delete(file)));
  }
  return inFlight.get(file);
}

async function fetchCached(url, file, valid) {
  const missing = `${file}.404`;
  if (existsSync(missing) && !RETRY_404) return null;
  if (existsSync(file)) return gunzipSync(await readFile(file)).toString("utf8");

  const host = new URL(url).host;
  for (let attempt = 1; ; attempt++) {
    await throttle(host);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
      await mkdir(path.dirname(file), { recursive: true });
      if (res.status === 404) {
        await writeFile(missing, "");
        return null;
      }
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), { fatal: true });
      const body = Buffer.from(await res.arrayBuffer());
      const gz = url.endsWith(".gz") ? body : gzipSync(body);
      const text = gunzipSync(gz).toString("utf8"); // validates the archive
      if (valid && !valid(text)) {
        console.warn(`  ! ${url}: unexpected response – used for this run only, not cached`);
        return text;
      }
      await writeFile(file, gz);
      if (existsSync(missing)) await rm(missing);
      return text;
    } catch (error) {
      if (error.fatal || attempt >= 6) throw error;
      const backoff = 3_000 * 2 ** (attempt - 1);
      console.warn(`  ! ${url}: ${error.message} – retrying in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
}

/** Runs `fn` over `items` with at most `limit` calls in flight. */
async function forEachConcurrent(items, limit, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const r1 = (value) => Math.round(value * 10) / 10 + 0; // +0 turns -0 into 0
const signed = (value, digits = 1) => `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
const sum = (values) => values.reduce((a, b) => a + b, 0);
const mean = (values) => sum(values) / values.length;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const daysIn = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
/** Mean month length over the period (Feb ≈ 28.25). */
const MEAN_DAYS = Array.from({ length: 12 }, (_, m) => {
  let total = 0;
  for (let y = PERIOD_START; y <= PERIOD_END; y++) total += daysIn(y, m + 1);
  return total / YEARS;
});
const num = (value) => (value === "" || value === undefined ? null : Number(value));
const year = (date) => Number(String(date ?? "").slice(0, 4)) || null;
/** Annual mean of the daily range hi − lo. */
const meanRange = (months) => mean(months.map((m) => m.hi - m.lo));
/** Largest monthly |Δhi| or |Δlo| between two sets of months. */
const maxTempDelta = (a, b) =>
  Math.max(...a.map((m, i) => Math.max(Math.abs(m.hi - b[i].hi), Math.abs(m.lo - b[i].lo))));
/** Largest monthly difference of the mean temperature (hi + lo) / 2 between two sets of months. */
const maxMeanDelta = (a, b) => Math.max(...a.map((m, i) => Math.abs((m.hi + m.lo - b[i].hi - b[i].lo) / 2)));

/* -------------------------------------------------------------------------- */
/* Meteostat                                                                  */
/* -------------------------------------------------------------------------- */

/** Stations with published 1991–2020 normals or a daily series that can cover MIN_YEARS_NORMAL of the period. */
async function loadStations(minYears) {
  const text = await cachedText(`${METEOSTAT}/stations/lite.json.gz`, "meteostat/stations-lite.json.gz");
  return JSON.parse(text)
    .filter((s) => {
      if (
        !Number.isFinite(s.location?.latitude) ||
        !Number.isFinite(s.location?.longitude) ||
        !Number.isFinite(s.location?.elevation) ||
        BAD_STATIONS.has(s.id)
      ) {
        return false;
      }
      const daily = s.inventory?.daily;
      const from = Math.max(year(daily?.start) ?? Infinity, PERIOD_START);
      const to = Math.min(year(daily?.end) ?? -Infinity, PERIOD_END);
      return s.inventory?.normals?.end >= PERIOD_END || to - from + 1 >= minYears;
    })
    .map((s) => ({
      id: s.id,
      name: s.name?.en ?? s.id,
      lat: s.location.latitude,
      lon: s.location.longitude,
      ele: s.location.elevation,
    }));
}

/**
 * Meteostat's published 1991–2020 normals, per variable: a 12-month array when
 * complete and plausible, otherwise null. temps: [{ hi, lo }], prcp: [mm],
 * sun: [hours per day].
 */
async function publishedNormals(station) {
  const result = { temps: null, prcp: null, sun: null, notes: [] };
  const text = await cachedText(
    `${METEOSTAT}/normals/${encodeURIComponent(station.id)}.csv.gz`,
    `meteostat/normals/${encodeURIComponent(station.id)}.csv.gz`
  );
  if (!text) return result;
  const months = new Array(12).fill(null);
  for (const line of text.split("\n")) {
    const [start, end, month, tmin, tmax, prcp, , , tsun] = line.trim().split(",");
    if (Number(start) !== PERIOD_START || Number(end) !== PERIOD_END) continue;
    months[Number(month) - 1] = { lo: num(tmin), hi: num(tmax), p: num(prcp), tsun: num(tsun) };
  }
  const all = (test) => months.every((m) => m && test(m));
  if (all((m) => m.hi !== null && m.lo !== null)) {
    if (all((m) => m.hi >= m.lo && m.hi <= 50 && m.lo >= -60)) {
      result.temps = months.map((m) => ({ hi: m.hi, lo: m.lo }));
    } else {
      result.notes.push("published temperature normals implausible");
    }
  }
  if (all((m) => m.p !== null)) {
    if (all((m) => m.p >= 0 && m.p <= 2500)) result.prcp = months.map((m) => m.p);
    else result.notes.push("published precipitation normals implausible");
  }
  if (all((m) => m.tsun !== null && m.tsun >= 0)) {
    result.sun = months.map((m, i) => m.tsun / 60 / MEAN_DAYS[i]);
  }
  return result;
}

/**
 * The station's daily series for the period, grouped per month-year:
 * Map "year-month" → { y, m, days, tmax: [{ v, spike }], tmin: [...], prcp: [], tsun: [], nT }.
 * Internally inconsistent temperatures and implausible mid-range gaps are
 * dropped, single-day spikes are marked for the record filter, and month-years
 * whose mean departs wildly from the other years of the same calendar month
 * (corrupted blocks) lose their temperatures. Returns null without a daily file.
 */
async function loadDaily(station) {
  const text = await cachedText(
    `${METEOSTAT}/daily/${encodeURIComponent(station.id)}.csv.gz`,
    `meteostat/daily/${encodeURIComponent(station.id)}.csv.gz`
  );
  if (!text) return null;

  // Columns: date, tavg, tmin, tmax, prcp, snow, wdir, wspd, wpgt, pres, tsun (minutes).
  const days = [];
  for (const line of text.split("\n")) {
    const [date, tavg, tmin, tmax, prcp, , , , , , tsun] = line.trim().split(",");
    const y = year(date);
    if (!(y >= PERIOD_START && y <= PERIOD_END)) continue;
    const day = {
      t: Date.parse(`${date}T00:00:00Z`),
      y,
      m: Number(date.slice(5, 7)),
      tavg: num(tavg),
      tmin: num(tmin),
      tmax: num(tmax),
      prcp: num(prcp),
      tsun: num(tsun),
    };
    const { tavg: a, tmin: lo, tmax: hi } = day;
    const inconsistent =
      (lo !== null && hi !== null && lo > hi) ||
      (a !== null && ((lo !== null && a < lo - 1) || (hi !== null && a > hi + 1)));
    if (inconsistent) {
      day.tmin = day.tmax = null;
    } else if (a !== null && lo !== null && hi !== null) {
      // The daily mean should sit near the mid-range. A far too low minimum (tmin −11.3
      // with tavg 5.2 in Kuwait) pulls the mid-range down; genuine heat spikes followed
      // by a cool change (Melbourne, 7 Feb 2009: 47.5 °C, tavg 26.3) pull it up a lot.
      const gap = (lo + hi) / 2 - a;
      if (gap < -MAX_MIDRANGE_GAP_LOW_C) day.tmin = null;
      if (gap > MAX_MIDRANGE_GAP_HIGH_C) day.tmax = null;
    }
    if (day.prcp !== null && (day.prcp < 0 || day.prcp > 1000)) day.prcp = null;
    if (day.tsun !== null && (day.tsun < 0 || day.tsun > 1440)) day.tsun = null;
    days.push(day);
  }

  // Single-day spikes: a value beyond both neighbouring days by more than SPIKE_C.
  const DAY = 86_400_000;
  const isSpike = new Set();
  for (let i = 1; i < days.length - 1; i++) {
    const [prev, day, next] = [days[i - 1], days[i], days[i + 1]];
    if (prev.t !== day.t - DAY || next.t !== day.t + DAY) continue;
    for (const key of ["tmax", "tmin"]) {
      const x = day[key];
      if (x === null || prev[key] === null || next[key] === null) continue;
      const beyond = key === "tmax" ? x - Math.max(prev[key], next[key]) : Math.min(prev[key], next[key]) - x;
      if (beyond > SPIKE_C) isSpike.add(`${i}:${key}`);
    }
  }

  const cells = new Map();
  for (const [i, day] of days.entries()) {
    const key = `${day.y}-${day.m}`;
    let cell = cells.get(key);
    if (!cell) {
      cell = { y: day.y, m: day.m, days: daysIn(day.y, day.m), tmax: [], tmin: [], prcp: [], tsun: [], nT: 0 };
      cells.set(key, cell);
    }
    if (day.tmax !== null && day.tmin !== null) cell.nT++;
    if (day.tmax !== null) cell.tmax.push({ v: day.tmax, spike: isSpike.has(`${i}:tmax`) });
    if (day.tmin !== null) cell.tmin.push({ v: day.tmin, spike: isSpike.has(`${i}:tmin`) });
    if (day.prcp !== null) cell.prcp.push(day.prcp);
    if (day.tsun !== null) cell.tsun.push(day.tsun);
  }

  // Corrupted month-years. The limit scales with each calendar month's year-to-year
  // variability, so genuine cold winters in variable climates (Calgary, February
  // 2019 at −13 °C) survive.
  const corrupted = [];
  for (let m = 1; m <= 12; m++) {
    const ofMonth = [...cells.values()].filter((c) => c.m === m);
    for (const key of ["tmax", "tmin"]) {
      const rows = ofMonth.filter((c) => c[key].length >= 10).map((c) => ({ c, v: mean(c[key].map((d) => d.v)) }));
      if (rows.length < 5) continue;
      const centre = median(rows.map((r) => r.v));
      const sigma = 1.4826 * median(rows.map((r) => Math.abs(r.v - centre)));
      const limit = Math.max(MAX_MONTH_ANOMALY_C, MONTH_ANOMALY_SIGMAS * sigma);
      for (const { c, v } of rows) {
        if (Math.abs(v - centre) <= limit || c.corrupt) continue;
        c.corrupt = true;
        corrupted.push(`${c.y}-${m} (${key} ${signed(v - centre)} °C)`);
      }
    }
  }
  for (const cell of cells.values()) {
    if (cell.corrupt) Object.assign(cell, { tmax: [], tmin: [], nT: 0 });
  }
  return { cells, corrupted };
}

/**
 * Normals computed from the daily series, per variable: a 12-month array or null.
 * A month-year counts when at most MAX_MISSING_DAYS of its days lack the value
 * (temperatures: tmin and tmax both present). Precipitation needs MONTH_COVERAGE,
 * since missing days are often dry ones, and its totals are scaled up to the full
 * month. A monthly normal is the mean over at least MIN_YEARS_NORMAL such years.
 * With a POWER reference (`ref`: per month, per year { hi, lo }), the
 * temperature mean is adjusted for the years that are missing:
 *   normal = mean(station, years present)
 *          + mean(POWER, all years) − mean(POWER, years present).
 * Precipitation and sunshine are used as measured. `minTempYears` lowers the
 * year count for temperatures (adjusted ones only). `years` holds the fewest
 * qualifying years over the 12 months, for the log.
 */
function dailyNormals(daily, ref, minTempYears = MIN_YEARS_NORMAL) {
  const minYears = ref ? MIN_YEARS_NORMAL : MIN_YEARS_NORMAL_UNADJUSTED;
  const minTemps = ref ? minTempYears : MIN_YEARS_NORMAL_UNADJUSTED;
  const out = { temps: [], prcp: [], sun: [], years: { temps: YEARS, prcp: YEARS, sun: YEARS } };
  for (let m = 1; m <= 12; m++) {
    const temps = [];
    const p = [];
    const s = [];
    for (let y = PERIOD_START; y <= PERIOD_END; y++) {
      const cell = daily.cells.get(`${y}-${m}`);
      if (!cell) continue;
      if (cell.nT >= cell.days - MAX_MISSING_DAYS && (!ref || ref[m - 1][y - PERIOD_START])) {
        temps.push({ y, hi: mean(cell.tmax.map((d) => d.v)), lo: mean(cell.tmin.map((d) => d.v)) });
      }
      if (cell.prcp.length >= cell.days * MONTH_COVERAGE) p.push((sum(cell.prcp) * cell.days) / cell.prcp.length);
      if (cell.tsun.length >= cell.days - MAX_MISSING_DAYS) s.push(mean(cell.tsun) / 60);
    }
    out.years.temps = Math.min(out.years.temps, temps.length);
    out.years.prcp = Math.min(out.years.prcp, p.length);
    out.years.sun = Math.min(out.years.sun, s.length);

    let normal = null;
    if (temps.length >= minTemps) {
      normal = { hi: mean(temps.map((t) => t.hi)), lo: mean(temps.map((t) => t.lo)) };
      if (ref) {
        const all = ref[m - 1].filter(Boolean);
        const present = temps.map((t) => ref[m - 1][t.y - PERIOD_START]);
        for (const key of ["hi", "lo"]) {
          if (temps.length >= MIN_YEARS_SHORT_RECORD) {
            normal[key] += mean(all.map((r) => r[key])) - mean(present.map((r) => r[key]));
          } else {
            // Very short records (last resort): a single bad year would dominate the
            // mean, so use POWER's full-period mean plus the median of the yearly
            // station-minus-POWER differences (Alanya's Gazipaşa: January 2008 reads
            // 7 °C colder than the other years).
            const diffs = temps.map((t, i) => t[key] - present[i][key]).sort((a, b) => a - b);
            const k = diffs.length;
            const typical = (diffs[Math.floor((k - 1) / 2)] + diffs[Math.floor(k / 2)]) / 2;
            normal[key] = mean(all.map((r) => r[key])) + typical;
          }
        }
      }
    }
    out.temps.push(normal);
    out.prcp.push(p.length >= minYears ? mean(p) : null);
    out.sun.push(s.length >= minYears ? mean(s) : null);
  }
  for (const key of ["temps", "prcp", "sun"]) {
    if (out[key].some((v) => v === null)) out[key] = null;
  }
  if (out.temps?.some((m) => m.hi < m.lo || m.hi > 50 || m.lo < -60)) out.temps = null;
  if (out.prcp?.some((p) => p > 2500)) out.prcp = null;
  return out;
}

/**
 * Monthly record (highest tmax / lowest tmin) from QC'd daily values, or null.
 * Station series contain bad values (e.g. tmin 4 °C in Singapore, "0" placeholders),
 * so the extreme must not lie far beyond the bulk of the distribution. With
 * r = (extreme − P99) / (P99 − P50) (mirrored for lows), a value is dropped and the
 * next one tried when r > TAIL_RATIO_HIGH/LOW, or r > SPIKE_TAIL_RATIO and it is an isolated
 * single-day spike. Genuine one-day extremes (Sydney 45.8 °C, Jan 2013) sit well
 * inside these bounds; multi-day heat or cold waves are never spikes.
 * items: [{ v, spike }]
 */
function robustExtreme(items, direction, dropped) {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => (direction > 0 ? b.v - a.v : a.v - b.v)); // extreme first
  const at = (q) => sorted[Math.round(q * (sorted.length - 1))].v;
  const middle = at(0.5);
  const tail = at(0.01); // P99 for highs, P1 for lows
  const spread = Math.max(Math.abs(tail - middle), 0.5);
  let i = 0;
  while (i < sorted.length - 1 && i < MAX_TAIL_DROPS) {
    const { v, spike } = sorted[i];
    const r = ((v - tail) * direction) / spread;
    const limit = direction > 0 ? TAIL_RATIO_HIGH : TAIL_RATIO_LOW;
    if (!(r > limit || (spike && r > SPIKE_TAIL_RATIO))) break;
    dropped.push(v);
    i++;
  }
  return i < MAX_TAIL_DROPS ? sorted[i].v : null;
}

/** Mean days with ≥ 1 mm per month, when the daily series is complete enough and agrees with `prcp`. */
function rainDays(daily, prcp, notes) {
  const pd = [];
  for (let m = 1; m <= 12; m++) {
    const counts = [];
    const totals = [];
    for (let y = PERIOD_START; y <= PERIOD_END; y++) {
      const cell = daily.cells.get(`${y}-${m}`);
      if (!cell || cell.prcp.length < cell.days * MONTH_COVERAGE) continue;
      const scale = cell.days / cell.prcp.length;
      counts.push(cell.prcp.filter((v) => v >= 1).length * scale);
      totals.push(sum(cell.prcp) * scale);
    }
    if (counts.length < MIN_YEARS_RAIN_DAYS) {
      notes.push("rain days dropped: incomplete precipitation series");
      return null;
    }
    const dailyTotal = mean(totals);
    if (Math.abs(dailyTotal - prcp[m - 1]) > Math.max(10, 0.25 * prcp[m - 1])) {
      notes.push(`rain days dropped: month ${m} daily total ${dailyTotal.toFixed(1)} vs normal ${prcp[m - 1].toFixed(1)}`);
      return null;
    }
    pd.push(mean(counts));
  }
  return pd;
}

/**
 * Monthly records from the daily series: per month a robust extreme, checked
 * against the station's own temperature normals. Returns { rhi, rlo } (null
 * entries for up to MAX_RECORD_GAPS failed months), or null.
 */
function monthlyRecords(daily, temps, notes) {
  if (daily.corrupted.length) {
    notes.push("records dropped: series contains corrupted month blocks");
    return null;
  }
  const rhi = [];
  const rlo = [];
  const problems = [];
  for (let m = 1; m <= 12; m++) {
    const normal = temps[m - 1];
    const highs = [];
    const lows = [];
    let yearsT = 0;
    for (let y = PERIOD_START; y <= PERIOD_END; y++) {
      const cell = daily.cells.get(`${y}-${m}`);
      if (!cell) continue;
      if (cell.nT >= cell.days * MONTH_COVERAGE) yearsT++;
      highs.push(...cell.tmax);
      lows.push(...cell.tmin);
    }
    if (yearsT < MIN_YEARS_EXTREMES) {
      rhi.push(null);
      rlo.push(null);
      problems.push(`month ${m}: only ${yearsT} complete years`);
      continue;
    }
    const droppedHi = [];
    const droppedLo = [];
    const hi = robustExtreme(highs, 1, droppedHi);
    const lo = robustExtreme(lows, -1, droppedLo);
    if (droppedHi.length) notes.push(`month ${m}: dropped tmax outliers ${droppedHi.join(", ")}`);
    if (droppedLo.length) notes.push(`month ${m}: dropped tmin outliers ${droppedLo.join(", ")}`);
    // Loose safety net after the tail filter. Heat spikes can exceed the mean max by
    // ~20 °C (Sydney, Melbourne); warm-season nights vary far less than winter ones.
    const maxAbove = 25;
    const maxBelow = normal.lo >= 15 ? 16 : normal.lo >= 5 ? 20 : 40;
    const okHi = hi !== null && hi >= normal.hi + 1 && hi <= normal.hi + maxAbove;
    const okLo = lo !== null && lo <= normal.lo - 1 && lo >= normal.lo - maxBelow;
    if (okHi && okLo) {
      rhi.push(hi);
      rlo.push(lo);
    } else {
      rhi.push(null);
      rlo.push(null);
      problems.push(`month ${m}: rhi ${hi} / rlo ${lo} implausible vs hi ${normal.hi.toFixed(1)} / lo ${normal.lo.toFixed(1)}`);
    }
  }
  const failed = rhi.filter((v) => v === null).length;
  if (failed > MAX_RECORD_GAPS) {
    notes.push(`records dropped (${failed} months failed, e.g. ${problems[0]})`);
    return null;
  }
  if (failed) notes.push(`records omitted for ${problems.join("; ")}`);
  return { rhi, rlo };
}

/**
 * Everything one station offers, before any elevation adjustment:
 * { station, temps, tempsFrom, prcp, prcpFrom, sun, pd, rhi, rlo, notes, why }.
 * Each variable comes from the published normals when complete, else from the
 * daily series; null when neither is usable. `power` is the reference for
 * daily-derived normals, `minTempYears` their minimum record (see dailyNormals).
 * Memoized, since neighbouring places share stations and POWER grid cells.
 */
const stationMemo = new Map();
function stationClimate(station, power, minTempYears = MIN_YEARS_NORMAL) {
  const key = `${station.id}|${power?.cell ?? "-"}|${minTempYears}`;
  if (!stationMemo.has(key)) stationMemo.set(key, buildStationClimate(station, power, minTempYears));
  return stationMemo.get(key);
}

async function buildStationClimate(station, power, minTempYears) {
  const published = await publishedNormals(station);
  const notes = [...published.notes];
  const daily = await loadDaily(station);
  const derived = daily ? dailyNormals(daily, power?.byYear, minTempYears) : null;
  if (daily?.corrupted.length) notes.push(`ignored temperatures of implausible month(s) ${daily.corrupted.join(", ")}`);

  const choose = (key) =>
    published[key] ? [published[key], "normals"] : derived?.[key] ? [derived[key], "daily"] : [null, null];
  const [temps, tempsFrom] = choose("temps");
  const [prcp, prcpFrom] = choose("prcp");
  let [sun] = choose("sun");
  if (sun?.some((h) => h > 15)) {
    notes.push("sunshine dropped: implausible values");
    sun = null;
  }

  const result = { station, temps, tempsFrom, prcp, prcpFrom, sun, notes };
  // Record length behind daily-derived temperatures, or why there are none, for the log.
  result.tempsYears = derived?.years.temps ?? 0;
  result.why = daily ? `daily series has ${derived.years.temps} complete years in its weakest month` : "no daily file";
  if (daily && prcp) result.pd = rainDays(daily, prcp, notes);
  if (daily && temps) Object.assign(result, monthlyRecords(daily, temps, notes) ?? {});
  return result;
}

/**
 * Stations around a place within `maxKm` and `maxDz` that pass `accept`, best
 * first (distance + weighted elevation difference).
 */
function rankStations(stations, place, maxKm, maxDz = MAX_ELEVATION_DIFF_M, accept = () => true) {
  return stations
    .map((s) => ({ s, d: distanceKm(place.lat, place.lon, s.lat, s.lon), dz: s.ele - place.ele }))
    .filter((c) => c.d <= maxKm && Math.abs(c.dz) <= maxDz && accept(c))
    .sort((a, b) => a.d + Math.abs(a.dz) * ELEVATION_WEIGHT_KM_PER_M - (b.d + Math.abs(b.dz) * ELEVATION_WEIGHT_KM_PER_M))
    .slice(0, MAX_CANDIDATES);
}

/** A station's temperature normals shifted to the place elevation. */
function placeTemps(sc, place) {
  return sc.temps.map((t, i) => ({
    hi: t.hi + lapseShift("hi", i, place.lat, sc.station.ele, place.ele),
    lo: t.lo + lapseShift("lo", i, place.lat, sc.station.ele, place.ele),
  }));
}

/* -------------------------------------------------------------------------- */
/* NASA POWER                                                                 */
/* -------------------------------------------------------------------------- */

/** Centre of the MERRA-2 grid cell that POWER serves for a point. */
function powerCell(lat, lon) {
  const cLat = Math.round(lat / POWER_GRID_LAT) * POWER_GRID_LAT;
  const cLon = Math.round((lon + 180) / POWER_GRID_LON) * POWER_GRID_LON - 180;
  const fmt = (v) => String(Number(v.toFixed(4)) + 0);
  return `${fmt(cLat)},${fmt(cLon)}`;
}

/** Whether a POWER response carries every requested parameter (worth caching). */
function isCompletePowerResponse(text) {
  try {
    const parameter = JSON.parse(text).properties?.parameter;
    return POWER_PARAMETERS.every((p) => parameter?.[p] && Object.keys(parameter[p]).length > 0);
  } catch {
    return false;
  }
}

/** Monthly means from POWER daily data, lapse-rate corrected to the place elevation. */
async function powerClimate(place) {
  const lat = place.lat.toFixed(4);
  const lon = place.lon.toFixed(4);
  const url =
    `${POWER}?parameters=${POWER_PARAMETERS.join(",")}&community=${POWER_COMMUNITY}` +
    `&longitude=${lon}&latitude=${lat}&start=${PERIOD_START}0101&end=${PERIOD_END}1231&format=JSON`;
  // The cache key spells out everything that shapes the response.
  const file = `power/${POWER_COMMUNITY}_${POWER_PARAMETERS.join("-")}_${PERIOD_START}-${PERIOD_END}/${lat}_${lon}.json.gz`;
  const text = await cachedText(url, file, isCompletePowerResponse);
  if (!text) return null;
  const json = JSON.parse(text);
  const parameter = json.properties?.parameter;
  const fill = json.header?.fill_value ?? -999;
  const gridEle = json.geometry?.coordinates?.[2];
  if (!POWER_PARAMETERS.every((p) => parameter?.[p]) || !Number.isFinite(gridEle)) return null;

  // [sum, count] per month (all years) and per month-year (for byYear).
  const slots = () => ({ hi: [0, 0], lo: [0, 0], p: [0, 0] });
  const sums = Array.from({ length: 12 }, slots);
  const perYear = Array.from({ length: 12 }, () => Array.from({ length: YEARS }, slots));
  const add = (slot, value) => {
    if (typeof value === "number" && value !== fill && value > -900) {
      slot[0] += value;
      slot[1]++;
    }
  };
  for (const [date, value] of Object.entries(parameter.T2M_MAX)) {
    const m = Number(date.slice(4, 6)) - 1;
    const y = Number(date.slice(0, 4)) - PERIOD_START;
    for (const s of [sums[m], perYear[m][y]]) {
      add(s.hi, value);
      add(s.lo, parameter.T2M_MIN[date]);
      add(s.p, parameter.PRECTOTCORR[date]);
    }
  }
  // Require 25 of 30 years of days in every month.
  if (sums.some((s, i) => Math.min(s.hi[1], s.lo[1], s.p[1]) < 25 * MEAN_DAYS[i])) return null;
  const months = sums.map((s, i) => ({
    hi: s.hi[0] / s.hi[1] + lapseShift("hi", i, place.lat, gridEle, place.ele),
    lo: s.lo[0] / s.lo[1] + lapseShift("lo", i, place.lat, gridEle, place.ele),
    p: (s.p[0] / s.p[1]) * MEAN_DAYS[i], // mm/day → monthly total
  }));
  // Uncorrected monthly means per year (null when incomplete): the reference for
  // daily-derived station normals, where only year-to-year differences matter.
  const byYear = perYear.map((years, m) =>
    years.map((s, y) =>
      Math.min(s.hi[1], s.lo[1]) >= daysIn(PERIOD_START + y, m + 1) - MAX_MISSING_DAYS
        ? { hi: s.hi[0] / s.hi[1], lo: s.lo[0] / s.lo[1] }
        : null
    )
  );
  return { months, byYear, gridEle, cell: powerCell(place.lat, place.lon) };
}

/* -------------------------------------------------------------------------- */
/* Per place                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Why POWER may not represent a place (see MIN_POWER_RANGE_C and
 * TERRAIN_MISMATCH_M), with the elevation limit for the second station
 * pass; null when POWER looks fine.
 */
function powerDoubt(place, power) {
  const range = meanRange(power.months);
  if (range < MIN_POWER_RANGE_C) {
    return {
      kind: "coast",
      reason: `POWER daily range only ${range.toFixed(1)} °C (grid cell partly sea?)`,
      maxDz: MAX_ELEVATION_DIFF_M,
    };
  }
  const offset = place.ele - power.gridEle;
  if (Math.abs(offset) >= TERRAIN_MISMATCH_M) {
    return {
      kind: "terrain",
      reason: `POWER grid cell ${signed(-offset, 0)} m from the place elevation (terrain)`,
      maxDz: MAX_ELEVATION_DIFF_TERRAIN_M,
    };
  }
  return null;
}

/** Whether a last-resort candidate beyond EXTENDED_DISTANCE_KM shares the place's setting (see MIN_YEARS_LAST_RESORT). */
function similarSetting({ s, d, dz }, doubt) {
  if (d <= EXTENDED_DISTANCE_KM) return true;
  if (doubt.kind === "coast") return s.ele <= SIMILAR_COAST_MAX_ELE_M && Math.abs(dz) <= SIMILAR_COAST_MAX_DZ_M;
  return Math.abs(dz) <= SIMILAR_TERRAIN_MAX_DZ_M;
}

/**
 * Picks the temperature station and the precipitation source for one place and
 * returns { months, source, precipSource, origin, ... } or null (no data).
 * `log` collects the human-readable trace.
 */
async function placeClimate(place, { stations, shortRecordStations, lastResortStations }, power, log) {
  const near = rankStations(stations, place, MAX_DISTANCE_KM);
  const describe = ({ s, d, dz }) => `${s.id} ${s.name}, ${d.toFixed(1)} km, Δh ${signed(dz, 0)} m`;

  const doubt = power && powerDoubt(place, power);
  const maxDisagreement = doubt ? MAX_TEMP_DISAGREEMENT_DOUBTFUL_C : MAX_TEMP_DISAGREEMENT_C;

  /** First candidate with usable temperature normals, or null. */
  const findTemps = async (candidates, minTempYears) => {
    for (const c of candidates) {
      const sc = await stationClimate(c.s, power, minTempYears);
      if (!sc.temps) {
        log(`- ${describe(c)}: no temperature normals (${sc.why})`);
        continue;
      }
      if (sc.tempsFrom === "daily" && power) {
        const delta = maxMeanDelta(placeTemps(sc, place), power.months);
        if (delta > maxDisagreement) {
          log(`- ${describe(c)}: daily-derived mean temperatures differ from POWER by ${delta.toFixed(1)} °C – rejected`);
          continue;
        }
      }
      return { ...c, sc };
    }
    return null;
  };

  // First pass: nearby stations with a full record. Second pass, before falling
  // back to POWER: shorter records, and where POWER looks unrepresentative also
  // farther stations and larger elevation differences.
  let temp = await findTemps(near, MIN_YEARS_NORMAL);
  let secondPass = false;
  if (!temp && power) {
    log(
      `no station with ≥ ${MIN_YEARS_NORMAL} years – trying shorter records (≥ ${MIN_YEARS_SHORT_RECORD} years)` +
        (doubt ? `, up to ${EXTENDED_DISTANCE_KM} km and Δh ${doubt.maxDz} m, since ${doubt.reason}` : "")
    );
    // The regular pool only has stations whose record can cover MIN_YEARS_NORMAL,
    // so shorter records need their own pool.
    const candidates = doubt
      ? rankStations(shortRecordStations, place, EXTENDED_DISTANCE_KM, doubt.maxDz)
      : rankStations(shortRecordStations, place, MAX_DISTANCE_KM);
    temp = await findTemps(candidates, MIN_YEARS_SHORT_RECORD);
    secondPass = Boolean(temp);
  }
  // Last resort, only where POWER looks unrepresentative: very short records, and
  // farther stations in a similar setting (see MIN_YEARS_LAST_RESORT). It runs only
  // when both passes failed, so no other place is affected.
  let lastResort = false;
  if (!temp && doubt) {
    log(
      `last resort: records of ≥ ${MIN_YEARS_LAST_RESORT} years, up to ${LAST_RESORT_DISTANCE_KM} km ` +
        `(beyond ${EXTENDED_DISTANCE_KM} km only in a similar ${doubt.kind === "coast" ? "low coastal" : "mountain"} setting)`
    );
    const candidates = rankStations(lastResortStations, place, LAST_RESORT_DISTANCE_KM, doubt.maxDz, (c) =>
      similarSetting(c, doubt)
    );
    temp = await findTemps(candidates, MIN_YEARS_LAST_RESORT);
    lastResort = Boolean(temp);
  }

  // Precipitation is not elevation-corrected and varies over short distances, so it
  // only comes from regular candidates (near): the temperature station if it is one
  // of them, else the next one with a complete record, else POWER. Daily-derived
  // totals must agree with POWER; so must published ones from a station far above
  // or below the place (see MAX_PRECIP_ELEVATION_DIFF_M).
  const isNear = (c) => near.some((n) => n.s.id === c.s.id);
  const precipUsable = (c, sc) => {
    if (!sc.prcp) return false;
    if (!power) return true;
    const daily = sc.prcpFrom === "daily";
    if (!daily && Math.abs(c.dz) <= MAX_PRECIP_ELEVATION_DIFF_M) return true;
    const station = sum(sc.prcp);
    const grid = sum(power.months.map((m) => m.p));
    const ratio = station / Math.max(grid, 1);
    if (ratio >= 1 / MAX_PRECIP_RATIO && ratio <= MAX_PRECIP_RATIO) return true;
    log(
      `- ${sc.station.id}: ${daily ? "daily-derived" : `published (Δh ${signed(c.dz, 0)} m)`} precipitation ` +
        `${station.toFixed(0)} mm/yr vs POWER ${grid.toFixed(0)} – not used`
    );
    return false;
  };
  let precip = temp && isNear(temp) && precipUsable(temp, temp.sc) ? temp : null;
  if (!precip) {
    for (const c of near) {
      if (c.s.id === temp?.s.id) continue;
      const sc = await stationClimate(c.s, power);
      if (precipUsable(c, sc)) {
        precip = { ...c, sc };
        break;
      }
    }
  }

  if (!temp && !power) return null;
  if (!precip && !power) {
    log("no precipitation source");
    return null;
  }

  if (temp) {
    const { sc } = temp;
    const how = sc.tempsFrom === "normals" ? "published normals" : `computed from daily data, ≥ ${sc.tempsYears} years`;
    log(`temperatures: station ${describe(temp)} (${how})${secondPass ? " [second pass]" : lastResort ? " [last resort]" : ""}`);
    for (const n of sc.notes) log(`· ${n}`);
  } else {
    log(`temperatures: POWER grid ${power.cell} at ${power.gridEle.toFixed(0)} m` + (near.length ? "" : " (no station within limits)"));
  }
  if (precip && precip !== temp) {
    log(`precipitation: station ${describe(precip)} (${precip.sc.prcpFrom === "normals" ? "published normals" : "computed from daily data"})`);
  } else if (!precip) {
    log("precipitation: POWER");
  }

  const tempsAtPlace = temp ? placeTemps(temp.sc, place) : power.months;
  const months = tempsAtPlace.map((t, i) => {
    const out = { hi: r1(t.hi), lo: r1(t.lo), p: r1(precip ? precip.sc.prcp[i] : power.months[i].p) };
    if (precip?.sc.pd) out.pd = r1(precip.sc.pd[i]);
    if (temp?.sc.sun) out.sun = r1(temp.sc.sun[i]);
    if (temp?.sc.rhi?.[i] != null) {
      // Records move with the normals, so they stay consistent with hi / lo.
      out.rhi = r1(temp.sc.rhi[i] + (t.hi - temp.sc.temps[i].hi));
      out.rlo = r1(temp.sc.rlo[i] + (t.lo - temp.sc.temps[i].lo));
    }
    return out;
  });

  return {
    months,
    source: temp ? "meteostat" : "power",
    precipSource: precip ? "meteostat" : "power",
    origin: temp ? `meteostat:${temp.s.id}` : `power:${power.cell}`,
    tempsFrom: temp?.sc.tempsFrom ?? null,
    secondPass,
    lastResort,
    temp,
  };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log(`cache: ${CACHE_DIR}`);
  const places = JSON.parse(await readFile(PLACES_FILE, "utf8"));
  // Regular pool (published normals or a daily series that can cover MIN_YEARS_NORMAL),
  // and the wider pools of the second and last-resort passes.
  const stations = await loadStations(MIN_YEARS_NORMAL);
  const shortRecordStations = await loadStations(MIN_YEARS_SHORT_RECORD);
  const lastResortStations = await loadStations(MIN_YEARS_LAST_RESORT);
  console.log(
    `${places.length} places, ${stations.length} stations with ${PERIOD_START}–${PERIOD_END} normals or daily data ` +
      `(${lastResortStations.length} with ≥ ${MIN_YEARS_LAST_RESORT} years for the last resort)`
  );

  // POWER first, a few downloads at a time (the slow part of a cold run).
  const powerById = new Map();
  let done = 0;
  await forEachConcurrent(places, POWER_CONCURRENCY, async (place) => {
    powerById.set(place.id, await powerClimate(place));
    if (++done % 50 === 0 || done === places.length) console.log(`POWER ${done}/${places.length}`);
  });

  const data = {};
  const sources = {};
  const precipSources = {};
  const origins = {};
  const flags = [];
  const omitted = [];
  const unresolved = [];
  const stats = { meteostat: 0, normals: 0, daily: 0, secondPass: 0, lastResort: 0, power: 0, mixed: 0, sun: 0, pd: 0, records: 0 };

  for (const [index, place] of places.entries()) {
    const label = `${place.en} (${place.cc}, #${place.id}, ${place.ele} m)`;
    console.log(`[${index + 1}/${places.length}] ${label}`);
    const power = powerById.get(place.id);
    const result = await placeClimate(place, { stations, shortRecordStations, lastResortStations }, power, (line) => console.log(`    ${line}`));
    if (!result) {
      console.log("    no usable data – omitted");
      omitted.push(label);
      continue;
    }
    const { months } = result;
    data[place.id] = months;
    sources[place.id] = result.source;
    origins[place.id] = result.origin;
    if (result.precipSource !== result.source) {
      precipSources[place.id] = result.precipSource;
      stats.mixed++;
    }
    if (result.source === "meteostat") {
      stats.meteostat++;
      stats[result.tempsFrom]++;
      if (result.secondPass) stats.secondPass++;
      if (result.lastResort) stats.lastResort++;
    } else {
      stats.power++;
      const doubt = powerDoubt(place, power);
      if (doubt) unresolved.push(`${label}: POWER only – ${doubt.reason}`);
    }
    if (months[0].sun !== undefined) stats.sun++;
    if (months[0].pd !== undefined) stats.pd++;
    if (months.some((m) => m.rhi !== undefined)) stats.records++;

    // Cross-check station temperatures against reanalysis (both at the place elevation).
    if (result.temp && power) {
      const delta = maxTempDelta(months, power.months);
      const pPlace = sum(months.map((m) => m.p));
      const pPower = sum(power.months.map((m) => m.p));
      const ratio = pPlace / Math.max(pPower, 1);
      if (delta > 4 || ratio < 0.5 || ratio > 2) {
        flags.push(
          `${label}: ${result.origin} vs POWER – max ΔT ${delta.toFixed(1)} °C, annual precip ${pPlace.toFixed(0)} vs ${pPower.toFixed(0)} mm`
        );
      }
    }
  }

  const ids = Object.keys(data).sort((a, b) => Number(a) - Number(b));
  const header = {
    source:
      "Meteostat station climate normals 1991–2020 (published normals, or computed from quality-checked Meteostat daily station data where those are incomplete; " +
      "rain days and monthly records from the daily data), adjusted to the place elevation with seasonal lapse rates; " +
      "where no suitable station exists, and for missing station precipitation: NASA POWER (power.larc.nasa.gov) daily MERRA-2 data 1991–2020, " +
      "lapse-rate corrected to the place elevation",
    sourceUrl: "https://meteostat.net/",
    license: "Meteostat: CC BY-NC 4.0; NASA POWER: public domain (no restrictions)",
    period: `${PERIOD_START}–${PERIOD_END}`,
  };
  const block = (name, map, keys) => [
    `  ${JSON.stringify(name)}: {`,
    keys.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(map[id])}`).join(",\n"),
    "  }",
  ];
  const lines = [
    "{",
    ...Object.entries(header).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
    ...block("sources", sources, ids).with(-1, "  },"),
    ...block("precipSources", precipSources, ids.filter((id) => precipSources[id])).with(-1, "  },"),
    ...block("origins", origins, ids).with(-1, "  },"),
    ...block("data", data, ids),
    "}",
    "",
  ];
  await writeFile(OUT_FILE, lines.join("\n"));

  console.log(`\nflags (station vs POWER, review):`);
  for (const f of flags) console.log(`  ? ${f}`);
  console.log(`\nunresolved (POWER only although it looks unrepresentative, review):`);
  for (const u of unresolved) console.log(`  ! ${u}`);
  if (!unresolved.length) console.log("  none");
  console.log(`\nomitted: ${omitted.length ? omitted.join("; ") : "none"}`);
  const shared = new Map();
  for (const id of ids) shared.set(origins[id], (shared.get(origins[id]) ?? 0) + 1);
  console.log(
    `\nwrote ${ids.length}/${places.length} places: meteostat ${stats.meteostat} ` +
      `(published normals ${stats.normals}, from daily data ${stats.daily}, second pass ${stats.secondPass}, last resort ${stats.lastResort}), power ${stats.power}; ` +
      `precipitation from the other provider ${stats.mixed}; sun ${stats.sun}, rain days ${stats.pd}, records ${stats.records}; ` +
      `origins shared by several places: ${[...shared.values()].filter((n) => n > 1).length}`
  );

  // Sanity sample.
  const sample = [
    "Prague", "London", "Dubai", "Sydney", "La Paz", "Reykjavík", "Singapore", "Bangkok", "Lagos", "Moscow",
    "Punta Cana", "Funchal", "Štrbské Pleso", "Zermatt",
  ];
  console.log("\nsample (Jan | Jul: hi/lo/p [rlo..rhi]):");
  for (const name of sample) {
    const place = places.find((p) => p.en === name);
    const months = place && data[place.id];
    if (!months) {
      console.log(`  ${name}: –`);
      continue;
    }
    const fmt = (m) => `${m.hi}/${m.lo}/${m.p}${m.rhi !== undefined ? ` [${m.rlo}..${m.rhi}]` : ""}`;
    console.log(`  ${name.padEnd(14)} [${origins[place.id]}] Jan ${fmt(months[0])} | Jul ${fmt(months[6])}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
