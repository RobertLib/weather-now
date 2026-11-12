#!/usr/bin/env node
/**
 * Builds src/data/climate.json: monthly climate normals (1991–2020) for every
 * place in src/data/places.json.
 *
 * Primary source: Meteostat station normals (bulk.meteostat.net). For each
 * place we take the best station within MAX_DISTANCE_KM whose elevation differs
 * by less than MAX_ELEVATION_DIFF_M and whose 1991–2020 normals have tmin, tmax
 * and prcp for all 12 months. Sunshine comes from the same normals; rain days and
 * monthly records are derived from the station's daily series for 1991–2020 when
 * it is complete enough and consistent with the normals.
 *
 * Fallback: NASA POWER daily point data (MERRA-2 reanalysis, 1991–2020) averaged
 * per month, with a −6.5 °C/km lapse-rate correction from the grid-cell
 * elevation to the place elevation. POWER is also fetched for every place as an
 * independent cross-check of the station normals.
 *
 * Usage:
 *   DATA_CACHE_DIR=/path/to/cache node scripts/build-climate.mjs
 *
 * Downloads are cached in DATA_CACHE_DIR (default: <tmp>/weather-now-data-cache),
 * so an interrupted run resumes and re-runs are offline.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.resolve(
  process.env.DATA_CACHE_DIR ?? path.join(os.tmpdir(), "weather-now-data-cache")
);
const PLACES_FILE = path.join(ROOT, "src", "data", "places.json");
const OUT_FILE = path.join(ROOT, "src", "data", "climate.json");

const METEOSTAT = "https://bulk.meteostat.net/v2";
const POWER = "https://power.larc.nasa.gov/api/temporal/daily/point";

const MAX_DISTANCE_KM = 40;
const MAX_ELEVATION_DIFF_M = 200;
/** Ranking: 100 m of elevation difference weighs like 10 km of distance. */
const ELEVATION_WEIGHT_KM_PER_M = 0.1;
const MAX_CANDIDATES = 6;
const LAPSE_RATE_C_PER_M = -0.0065;

const PERIOD_START = 1991;
const PERIOD_END = 2020;
const YEARS = PERIOD_END - PERIOD_START + 1;

/** Daily series: a month-year counts when this share of its days has data. */
const MONTH_COVERAGE = 0.9;
/** …and a derived statistic needs this many such years in every month. */
const MIN_YEARS_RAIN_DAYS = 10;
const MIN_YEARS_EXTREMES = 20;
/*
 * Record QC (station daily series contain bad values: tmin 4 °C in Singapore,
 * "0" placeholders, whole months of misfiled data). See stationDaily/robustExtreme.
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
 * A month-year whose mean tmax/tmin anomaly exceeds max(MAX_MONTH_ANOMALY_C,
 * MONTH_ANOMALY_SIGMAS × robust σ of that calendar month) is a corrupted block
 * (e.g. Montreal McTavish, April 1995 recorded as midwinter).
 */
const MAX_MONTH_ANOMALY_C = 9;
const MONTH_ANOMALY_SIGMAS = 6;
/** Months without a trustworthy record a station may have before records are dropped entirely. */
const MAX_RECORD_GAPS = 2;

/** Stations whose normals proved wrong on review; skipped. */
const BAD_STATIONS = new Set([]);

/** Per-host politeness delays. */
const INTERVAL_MS = { "bulk.meteostat.net": 150, "power.larc.nasa.gov": 800 };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lastRequest = new Map();

/**
 * Download `url` into the cache (gzip-compressed unless already .gz) and return
 * the decompressed text, or null for 404. Throttled per host and retried.
 */
async function cachedText(url, relativeFile) {
  const file = path.join(CACHE_DIR, relativeFile);
  const missing = `${file}.404`;
  if (existsSync(missing)) return null;
  if (existsSync(file)) return gunzipSync(await readFile(file)).toString("utf8");

  const host = new URL(url).host;
  for (let attempt = 1; ; attempt++) {
    const wait = (lastRequest.get(host) ?? 0) + (INTERVAL_MS[host] ?? 500) - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest.set(host, Date.now());
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
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
      await writeFile(file, gz);
      return text;
    } catch (error) {
      if (error.fatal || attempt >= 6) throw error;
      const backoff = 3_000 * 2 ** (attempt - 1);
      console.warn(`  ! ${url}: ${error.message} – retrying in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
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
const daysIn = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
/** Mean month length over the period (Feb ≈ 28.25). */
const MEAN_DAYS = Array.from({ length: 12 }, (_, m) => {
  let total = 0;
  for (let y = PERIOD_START; y <= PERIOD_END; y++) total += daysIn(y, m + 1);
  return total / YEARS;
});
const num = (value) => (value === "" || value === undefined ? null : Number(value));

/* -------------------------------------------------------------------------- */
/* Meteostat                                                                  */
/* -------------------------------------------------------------------------- */

async function loadStations() {
  const text = await cachedText(`${METEOSTAT}/stations/lite.json.gz`, "meteostat/stations-lite.json.gz");
  return JSON.parse(text)
    .filter(
      (s) =>
        s.inventory?.normals?.end >= PERIOD_END &&
        Number.isFinite(s.location?.latitude) &&
        Number.isFinite(s.location?.longitude) &&
        Number.isFinite(s.location?.elevation) &&
        !BAD_STATIONS.has(s.id)
    )
    .map((s) => ({
      id: s.id,
      name: s.name?.en ?? s.id,
      lat: s.location.latitude,
      lon: s.location.longitude,
      ele: s.location.elevation,
    }));
}

/** 1991–2020 normals as { months } (12 objects), or { error } when missing/incomplete/implausible. */
async function stationNormals(station) {
  const text = await cachedText(
    `${METEOSTAT}/normals/${encodeURIComponent(station.id)}.csv.gz`,
    `meteostat/normals/${encodeURIComponent(station.id)}.csv.gz`
  );
  if (!text) return { error: "no normals file" };
  const months = new Array(12).fill(null);
  for (const line of text.split("\n")) {
    const [start, end, month, tmin, tmax, prcp, , , tsun] = line.trim().split(",");
    if (Number(start) !== PERIOD_START || Number(end) !== PERIOD_END) continue;
    months[Number(month) - 1] = { lo: num(tmin), hi: num(tmax), p: num(prcp), tsun: num(tsun) };
  }
  for (const [i, m] of months.entries()) {
    if (!m || m.lo === null || m.hi === null || m.p === null) return { error: `month ${i + 1} incomplete` };
    if (m.hi < m.lo || m.hi > 50 || m.lo < -60 || m.p < 0 || m.p > 2500) {
      return { error: `month ${i + 1} implausible (${JSON.stringify(m)})` };
    }
  }
  return { months };
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
  const median = at(0.5);
  const tail = at(0.01); // P99 for highs, P1 for lows
  const spread = Math.max(Math.abs(tail - median), 0.5);
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

/** Rain days and monthly records from the station's daily series, when reliable. */
async function stationDaily(station, normals) {
  const text = await cachedText(
    `${METEOSTAT}/daily/${encodeURIComponent(station.id)}.csv.gz`,
    `meteostat/daily/${encodeURIComponent(station.id)}.csv.gz`
  );
  if (!text) return { notes: ["no daily file"] };

  // Parse the period; drop internally inconsistent temperatures.
  const days = [];
  for (const line of text.split("\n")) {
    const [date, tavg, tmin, tmax, prcp] = line.split(",");
    const year = Number(date?.slice(0, 4));
    if (!(year >= PERIOD_START && year <= PERIOD_END)) continue;
    const day = {
      t: Date.parse(`${date}T00:00:00Z`),
      y: year,
      m: Number(date.slice(5, 7)),
      tavg: num(tavg),
      tmin: num(tmin),
      tmax: num(tmax),
      prcp: num(prcp),
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

  // [year-month] → values
  const cells = new Map();
  for (const [i, day] of days.entries()) {
    const key = `${day.y}-${day.m}`;
    let cell = cells.get(key);
    if (!cell) cells.set(key, (cell = { tmax: [], tmin: [], prcp: [], nT: 0 }));
    if (day.tmax !== null && day.tmin !== null) cell.nT++;
    if (day.tmax !== null) cell.tmax.push({ v: day.tmax, spike: isSpike.has(`${i}:tmax`) });
    if (day.tmin !== null) cell.tmin.push({ v: day.tmin, spike: isSpike.has(`${i}:tmin`) });
    if (day.prcp !== null) cell.prcp.push(day.prcp);
  }

  const notes = [];
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  // Corrupted month-years (scaled by each calendar month's year-to-year variability,
  // so genuine cold winters in variable climates, e.g. Calgary February 2019 at
  // −13 °C, survive). Their temperatures are ignored and the station gets no records.
  const corrupted = [];
  for (let m = 1; m <= 12; m++) {
    const normal = normals[m - 1];
    const months = [];
    for (let y = PERIOD_START; y <= PERIOD_END; y++) {
      const cell = cells.get(`${y}-${m}`);
      if (!cell) continue;
      const anomaly = (items, ref) => (items.length >= 10 ? mean(items.map((d) => d.v)) - ref : null);
      months.push({ y, cell, hi: anomaly(cell.tmax, normal.hi), lo: anomaly(cell.tmin, normal.lo) });
    }
    for (const key of ["hi", "lo"]) {
      const values = months.map((x) => x[key]).filter((v) => v !== null);
      if (values.length < 5) continue;
      const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
      const centre = median(values);
      const sigma = 1.4826 * median(values.map((v) => Math.abs(v - centre)));
      const limit = Math.max(MAX_MONTH_ANOMALY_C, MONTH_ANOMALY_SIGMAS * sigma);
      for (const x of months) {
        if (x[key] === null || Math.abs(x[key] - centre) <= limit || x.cell.corrupt) continue;
        x.cell.corrupt = true;
        corrupted.push(`${x.y}-${m} (${key === "hi" ? "tmax" : "tmin"} ${x[key] > 0 ? "+" : ""}${x[key].toFixed(1)} °C)`);
      }
    }
  }
  for (const cell of cells.values()) {
    if (cell.corrupt) {
      cell.tmax = [];
      cell.tmin = [];
    }
  }
  if (corrupted.length) notes.push(`ignored temperatures of implausible month(s) ${corrupted.join(", ")}`);
  const pd = [];
  const rhi = [];
  const rlo = [];
  const recordProblems = [];
  for (let m = 1; m <= 12; m++) {
    const normal = normals[m - 1];
    const rainDays = [];
    const totals = [];
    const highs = [];
    const lows = [];
    let yearsT = 0;
    for (let y = PERIOD_START; y <= PERIOD_END; y++) {
      const cell = cells.get(`${y}-${m}`);
      if (!cell) continue;
      const n = daysIn(y, m);
      if (cell.prcp.length >= n * MONTH_COVERAGE) {
        const scale = n / cell.prcp.length;
        rainDays.push(cell.prcp.filter((v) => v >= 1).length * scale);
        totals.push(cell.prcp.reduce((a, b) => a + b, 0) * scale);
      }
      if (cell.nT >= n * MONTH_COVERAGE) yearsT++;
      highs.push(...cell.tmax);
      lows.push(...cell.tmin);
    }

    // Rain days: enough complete years, and their totals must agree with the normals.
    if (rainDays.length >= MIN_YEARS_RAIN_DAYS) {
      const dailyTotal = mean(totals);
      const agrees = Math.abs(dailyTotal - normal.p) <= Math.max(10, 0.25 * normal.p);
      pd.push(agrees ? mean(rainDays) : { mismatch: `month ${m}: daily total ${dailyTotal.toFixed(1)} vs normal ${normal.p}` });
    } else {
      pd.push(null);
    }

    // Records: enough complete years, robust tails, then plausibility against the normals.
    if (yearsT < MIN_YEARS_EXTREMES) {
      rhi.push(null);
      rlo.push(null);
      recordProblems.push(`month ${m}: only ${yearsT} complete years`);
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
      recordProblems.push(`month ${m}: rhi ${hi} / rlo ${lo} implausible vs hi ${normal.hi} / lo ${normal.lo}`);
    }
  }

  const result = { notes };
  const mismatches = pd.filter((v) => v && typeof v === "object");
  if (pd.every((v) => typeof v === "number")) {
    result.pd = pd;
  } else if (mismatches.length) {
    notes.push(`rain days dropped: ${mismatches.length} month(s) disagree with normals (${mismatches[0].mismatch})`);
  } else {
    notes.push("rain days dropped: incomplete precipitation series");
  }

  // Records: per month; a station failing more than MAX_RECORD_GAPS months, or with
  // corrupted month blocks anywhere, is not trusted at all.
  const failed = rhi.filter((v) => v === null).length;
  if (corrupted.length && failed < 12) {
    notes.push("records dropped: series contains corrupted month blocks");
  } else if (failed === 0) {
    Object.assign(result, { rhi, rlo });
  } else if (failed <= MAX_RECORD_GAPS) {
    Object.assign(result, { rhi, rlo });
    notes.push(`records omitted for ${recordProblems.join("; ")}`);
  } else {
    notes.push(`records dropped (${failed} months failed, e.g. ${recordProblems[0]})`);
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* NASA POWER                                                                 */
/* -------------------------------------------------------------------------- */

/** Monthly means from POWER daily data, lapse-rate corrected to the place elevation. */
async function powerClimate(place) {
  const lat = place.lat.toFixed(4);
  const lon = place.lon.toFixed(4);
  const url =
    `${POWER}?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG` +
    `&longitude=${lon}&latitude=${lat}&start=${PERIOD_START}0101&end=${PERIOD_END}1231&format=JSON`;
  const text = await cachedText(url, `power/${lat}_${lon}.json.gz`);
  if (!text) return null;
  const json = JSON.parse(text);
  const parameter = json.properties?.parameter;
  const fill = json.header?.fill_value ?? -999;
  const gridEle = json.geometry?.coordinates?.[2];
  if (!parameter?.T2M_MAX || !Number.isFinite(gridEle)) return null;

  const sums = Array.from({ length: 12 }, () => ({ hi: [0, 0], lo: [0, 0], p: [0, 0] }));
  const add = (slot, value) => {
    if (typeof value === "number" && value !== fill && value > -900) {
      slot[0] += value;
      slot[1]++;
    }
  };
  for (const [date, value] of Object.entries(parameter.T2M_MAX)) {
    const s = sums[Number(date.slice(4, 6)) - 1];
    add(s.hi, value);
    add(s.lo, parameter.T2M_MIN[date]);
    add(s.p, parameter.PRECTOTCORR[date]);
  }
  const correction = LAPSE_RATE_C_PER_M * (place.ele - gridEle);
  const months = sums.map((s, i) => {
    if (s.hi[1] < 25 * MEAN_DAYS[i] || s.lo[1] < 25 * MEAN_DAYS[i] || s.p[1] < 25 * MEAN_DAYS[i]) return null;
    return {
      hi: s.hi[0] / s.hi[1] + correction,
      lo: s.lo[0] / s.lo[1] + correction,
      p: (s.p[0] / s.p[1]) * MEAN_DAYS[i],
    };
  });
  if (months.some((m) => m === null)) return null;
  return { months, gridEle, correction };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log(`cache: ${CACHE_DIR}`);
  const places = JSON.parse(await readFile(PLACES_FILE, "utf8"));
  const stations = await loadStations();
  console.log(`${places.length} places, ${stations.length} stations with ${PERIOD_START}–${PERIOD_END} normals`);

  const data = {};
  const sources = {};
  const flags = [];
  const omitted = [];
  const stats = { meteostat: 0, power: 0, sun: 0, pd: 0, records: 0 };

  for (const [index, place] of places.entries()) {
    const label = `${place.en} (${place.cc}, #${place.id}, ${place.ele} m)`;
    console.log(`[${index + 1}/${places.length}] ${label}`);

    const power = await powerClimate(place);
    const candidates = stations
      .map((s) => ({ s, d: distanceKm(place.lat, place.lon, s.lat, s.lon), dz: Math.abs(s.ele - place.ele) }))
      .filter(({ d, dz }) => d <= MAX_DISTANCE_KM && dz < MAX_ELEVATION_DIFF_M)
      .sort((a, b) => a.d + a.dz * ELEVATION_WEIGHT_KM_PER_M - (b.d + b.dz * ELEVATION_WEIGHT_KM_PER_M))
      .slice(0, MAX_CANDIDATES);

    let chosen = null;
    for (const { s, d, dz } of candidates) {
      const normals = await stationNormals(s);
      if (normals.error) {
        console.log(`    - ${s.id} ${s.name}: ${normals.error}`);
        continue;
      }
      chosen = { station: s, d, dz, normals: normals.months };
      break;
    }

    let months;
    if (chosen) {
      const { station, d, dz, normals } = chosen;
      console.log(`    station ${station.id} ${station.name}, ${d.toFixed(1)} km, Δh ${dz} m`);
      const daily = await stationDaily(station, normals);
      for (const n of daily.notes) console.log(`    · ${n}`);

      const hasSun = normals.every((m) => m.tsun !== null && m.tsun >= 0);
      months = normals.map((n, i) => {
        const out = { hi: r1(n.hi), lo: r1(n.lo), p: r1(n.p) };
        if (daily.pd) out.pd = r1(daily.pd[i]);
        if (hasSun) out.sun = r1(n.tsun / 60 / MEAN_DAYS[i]);
        if (daily.rhi?.[i] != null) {
          out.rhi = r1(daily.rhi[i]);
          out.rlo = r1(daily.rlo[i]);
        }
        return out;
      });
      if (hasSun && months.some((m) => m.sun > 15)) {
        console.log("    · sunshine dropped: implausible values");
        for (const m of months) delete m.sun;
      }
      sources[place.id] = "meteostat";
      stats.meteostat++;
      if (months[0].sun !== undefined) stats.sun++;
      if (months[0].pd !== undefined) stats.pd++;
      if (months.some((m) => m.rhi !== undefined)) stats.records++;

      // Cross-check against reanalysis.
      if (power) {
        const worst = { t: 0, i: 0 };
        for (const [i, m] of normals.entries()) {
          const delta = Math.max(Math.abs(m.hi - power.months[i].hi), Math.abs(m.lo - power.months[i].lo));
          if (delta > worst.t) Object.assign(worst, { t: delta, i });
        }
        const pStation = normals.reduce((a, m) => a + m.p, 0);
        const pPower = power.months.reduce((a, m) => a + m.p, 0);
        const ratio = pStation / Math.max(pPower, 1);
        if (worst.t > 4 || ratio < 0.5 || ratio > 2) {
          flags.push(
            `${label}: station ${station.id} ${station.name} vs POWER – max ΔT ${worst.t.toFixed(1)} °C (month ${worst.i + 1}), ` +
              `annual precip ${pStation.toFixed(0)} vs ${pPower.toFixed(0)} mm`
          );
        }
      }
    } else if (power) {
      console.log(
        `    POWER grid ${power.gridEle.toFixed(0)} m, lapse correction ${power.correction >= 0 ? "+" : ""}${power.correction.toFixed(2)} °C` +
          (candidates.length ? "" : " (no station within limits)")
      );
      months = power.months.map((m) => ({ hi: r1(m.hi), lo: r1(m.lo), p: r1(m.p) }));
      sources[place.id] = "power";
      stats.power++;
    } else {
      console.log("    no usable data – omitted");
      omitted.push(label);
      continue;
    }
    data[place.id] = months;
  }

  const ids = Object.keys(data).sort((a, b) => Number(a) - Number(b));
  const header = {
    source:
      "Meteostat station climate normals 1991–2020 (rain days and monthly records derived from quality-checked Meteostat daily station data); " +
      "where no suitable station exists: NASA POWER (power.larc.nasa.gov) daily MERRA-2 data 1991–2020, lapse-rate corrected to the place elevation",
    sourceUrl: "https://meteostat.net/",
    license: "Meteostat: CC BY-NC 4.0; NASA POWER: public domain (no restrictions)",
    period: `${PERIOD_START}–${PERIOD_END}`,
  };
  const lines = [
    "{",
    ...Object.entries(header).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
    '  "sources": {',
    ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(sources[id])}`).join(",\n"),
    "  },",
    '  "data": {',
    ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(data[id])}`).join(",\n"),
    "  }",
    "}",
    "",
  ];
  await writeFile(OUT_FILE, lines.join("\n"));

  console.log(`\nflags (station vs POWER, review):`);
  for (const f of flags) console.log(`  ? ${f}`);
  console.log(`\nomitted: ${omitted.length ? omitted.join("; ") : "none"}`);
  console.log(
    `\nwrote ${ids.length}/${places.length} places: meteostat ${stats.meteostat} ` +
      `(sun ${stats.sun}, rain days ${stats.pd}, records ${stats.records}), power ${stats.power}`
  );

  // Sanity sample.
  const sample = [
    "Prague", "London", "Dubai", "Sydney", "La Paz", "Reykjavík", "Singapore", "Bangkok", "Lagos", "Moscow",
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
    console.log(`  ${name.padEnd(10)} [${sources[place.id]}] Jan ${fmt(months[0])} | Jul ${fmt(months[6])}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
