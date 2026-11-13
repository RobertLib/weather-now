/** Mean length of a lunar month in days. */
const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 1000;

export interface MoonPhase {
  /** 0 = new, 0.5 = full, approaching 1 = new again. */
  fraction: number;
  /** Illuminated share of the disc, 0-1. */
  illumination: number;
  /** 0-7: new, waxing crescent, first quarter, waxing gibbous, full, … */
  phase: number;
  waxing: boolean;
  /** Days until the next full moon, rounded. */
  daysToFull: number;
}

export function moonPhase(unixSeconds: number): MoonPhase {
  const days = (unixSeconds - KNOWN_NEW_MOON) / 86400;
  const fraction = (((days / SYNODIC_MONTH) % 1) + 1) % 1;
  const toFull = (0.5 - fraction + 1) % 1;
  return {
    fraction,
    illumination: (1 - Math.cos(2 * Math.PI * fraction)) / 2,
    phase: Math.round(fraction * 8) % 8,
    waxing: fraction < 0.5,
    daysToFull: Math.round(toFull * SYNODIC_MONTH),
  };
}

/** Next new and full moon after `unixSeconds` (mean phases, ±1 day). */
export function nextMoonEvents(unixSeconds: number): { full: number; new: number } {
  const { fraction } = moonPhase(unixSeconds);
  const period = SYNODIC_MONTH * 86400;
  const toFull = ((0.5 - fraction + 1) % 1) * period;
  const toNew = ((1 - fraction) % 1 || 1) * period;
  return { full: unixSeconds + toFull, new: unixSeconds + toNew };
}

export interface DaylightInfo {
  /** 0 before sunrise, 1 after sunset, linear in between. */
  progress: number;
  isDay: boolean;
  /** Total daylight in minutes. */
  lengthMinutes: number;
  /** Minutes until the next sunrise/sunset event; null during polar day or night. */
  minutesToNextEvent: number | null;
  nextEvent: "sunrise" | "sunset" | null;
  /** Set when the sun doesn't rise or doesn't set at all today. */
  polar: "day" | "night" | null;
}

export function daylightInfo(
  now: number,
  day: { sunrise: number | null; sunset: number | null; daylight: number }
): DaylightInfo {
  const { sunrise, sunset } = day;
  if (sunrise === null || sunset === null) {
    const polarDay = day.daylight > 0;
    return {
      progress: polarDay ? 0.5 : 0,
      isDay: polarDay,
      lengthMinutes: polarDay ? 1440 : 0,
      minutesToNextEvent: null,
      nextEvent: null,
      polar: polarDay ? "day" : "night",
    };
  }

  const span = Math.max(1, sunset - sunrise);
  const progress = Math.min(1, Math.max(0, (now - sunrise) / span));
  const isDay = now >= sunrise && now <= sunset;
  const target = isDay ? sunset : now < sunrise ? sunrise : sunrise + 86400;

  return {
    progress,
    isDay,
    lengthMinutes: Math.round(span / 60),
    minutesToNextEvent: Math.max(0, Math.round((target - now) / 60)),
    nextEvent: isDay ? "sunset" : "sunrise",
    polar: null,
  };
}

/* ------------------------------------------------------------- sun times */
/* Adapted from the public-domain NOAA / SunCalc formulas. */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

const toDays = (ms: number) => ms / DAY_MS - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => (j + 0.5 - J1970) * DAY_MS;
const meanAnomaly = (d: number) => RAD * (357.5291 + 0.98560028 * d);
/**
 * Sun's ecliptic longitude `d` days after J2000. SunCalc keeps the perihelion
 * fixed at its J2000 value; it actually advances 1.72° a century, which by the
 * 2020s shifts the longitude by almost half a degree (minutes on sunrise times
 * near the equinoxes, hours on the solstice instants).
 */
const eclipticLongitude = (m: number, d: number) =>
  m +
  RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) +
  RAD * (102.9372 + 0.0000470935 * d) +
  Math.PI;
/**
 * Mean solar transit, in days after J2000. SunCalc adds J0 = 0.0009 days here,
 * which puts every sunrise and sunset ~78 s late against NOAA and Open-Meteo;
 * without it the times agree with NOAA to well under a minute.
 */
const approxTransit = (ht: number, lw: number, n: number) => (ht + lw) / (2 * Math.PI) + n;
const solarTransit = (ds: number, m: number, l: number) =>
  J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);

export interface SunTimes {
  /** Unix seconds; null during polar day or night. */
  sunrise: number | null;
  sunset: number | null;
  noon: number;
  /** Minutes of daylight; 0 or 1440 at the poles. */
  daylight: number;
}

/**
 * Sunrise and sunset for the local calendar day containing `middayUtcMs`
 * (pass roughly local noon expressed in UTC).
 */
export function sunTimes(middayUtcMs: number, lat: number, lon: number): SunTimes {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(middayUtcMs);
  const n = Math.round(d - lw / (2 * Math.PI));
  const ds = approxTransit(0, lw, n);
  const m = meanAnomaly(ds);
  const l = eclipticLongitude(m, ds);
  const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(l));
  const jNoon = solarTransit(ds, m, l);
  const h0 = -0.833 * RAD;
  const cosW = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  const noon = Math.round(fromJulian(jNoon) / 1000);

  if (cosW < -1) return { sunrise: null, sunset: null, noon, daylight: 1440 };
  if (cosW > 1) return { sunrise: null, sunset: null, noon, daylight: 0 };

  const w = Math.acos(cosW);
  const jSet = solarTransit(approxTransit(w, lw, n), m, l);
  const jRise = jNoon - (jSet - jNoon);
  const sunrise = Math.round(fromJulian(jRise) / 1000);
  const sunset = Math.round(fromJulian(jSet) / 1000);
  return { sunrise, sunset, noon, daylight: Math.round((sunset - sunrise) / 60) };
}

/* ------------------------------------------------------------ solstices */

/**
 * Apparent solar longitude in radians (Meeus, *Astronomical Algorithms*,
 * ch. 25, low accuracy: about 0.01°, i.e. the solstice to within ~15 minutes).
 */
function apparentSolarLongitude(unixSeconds: number): number {
  const t = (unixSeconds / 86_400 + J1970 - 0.5 - J2000) / 36_525;
  const l0 = 280.46646 + 36_000.76983 * t + 0.0003032 * t * t;
  const m = RAD * (357.52911 + 35_999.05029 * t - 0.0001537 * t * t);
  const c =
    (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m) +
    0.000289 * Math.sin(3 * m);
  const omega = RAD * (125.04 - 1934.136 * t);
  return RAD * (l0 + c - 0.00569 - 0.00478 * Math.sin(omega));
}

/** Instant (unix seconds) of the June or December solstice of a year. */
export function solstice(year: number, which: "june" | "december"): number {
  const target = which === "june" ? Math.PI / 2 : (3 * Math.PI) / 2;
  // Signed angle from the target, monotonic across the search window.
  const offset = (unix: number) => {
    const x = apparentSolarLongitude(unix) - target;
    return ((((x + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  };
  let lo = Date.UTC(year, which === "june" ? 5 : 11, 10) / 1000;
  let hi = lo + 20 * 86_400;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (offset(mid) < 0) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

/** Approximate local noon (in UTC ms) for a `YYYY-MM-DD` date at a longitude. */
export function localNoonUtc(date: string, lon: number): number {
  const [y, mo, d] = date.split("-").map(Number);
  return Date.UTC(y, mo - 1, d, 12) - (lon / 15) * 3_600_000;
}

/** Daylight in minutes on the 15th of a month. */
export function midMonthDaylight(month: number, lat: number, lon: number, year = 2025): number {
  const date = `${year}-${String(month + 1).padStart(2, "0")}-15`;
  return sunTimes(localNoonUtc(date, lon), lat, lon).daylight;
}
