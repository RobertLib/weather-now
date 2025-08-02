/** Mean length of a lunar month in days. */
const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 1000;

export interface MoonPhase {
  /** 0 = new, 0.5 = full, approaching 1 = new again. */
  fraction: number;
  /** Illuminated share of the disc, 0-1. */
  illumination: number;
  name: string;
  waxing: boolean;
  /** Days until the next full moon, rounded. */
  daysToFull: number;
}

export function moonPhase(unixSeconds: number): MoonPhase {
  const days = (unixSeconds - KNOWN_NEW_MOON) / 86400;
  const fraction = ((days / SYNODIC_MONTH) % 1 + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  const waxing = fraction < 0.5;

  const names = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent",
  ];
  const index = Math.round(fraction * 8) % 8;

  const toFull = (0.5 - fraction + 1) % 1;
  return {
    fraction,
    illumination,
    name: names[index],
    waxing,
    daysToFull: Math.round(toFull * SYNODIC_MONTH),
  };
}

export interface DaylightInfo {
  /** 0 before sunrise, 1 after sunset, linear in between. */
  progress: number;
  isDay: boolean;
  /** Total daylight in minutes. */
  lengthMinutes: number;
  /** Minutes until the next sunrise/sunset event. */
  minutesToNextEvent: number;
  nextEvent: "sunrise" | "sunset";
}

export function daylightInfo(
  now: number,
  sunrise: number,
  sunset: number
): DaylightInfo {
  const span = Math.max(1, sunset - sunrise);
  const progress = Math.min(1, Math.max(0, (now - sunrise) / span));
  const isDay = now >= sunrise && now <= sunset;
  const nextEvent: "sunrise" | "sunset" = isDay ? "sunset" : "sunrise";
  const target = isDay
    ? sunset
    : now < sunrise
    ? sunrise
    : sunrise + 86400; /* tomorrow, close enough for a countdown */

  return {
    progress,
    isDay,
    lengthMinutes: Math.round(span / 60),
    minutesToNextEvent: Math.max(0, Math.round((target - now) / 60)),
    nextEvent,
  };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
