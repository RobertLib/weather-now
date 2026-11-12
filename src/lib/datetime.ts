import { INTL_LOCALE, Locale } from "@/i18n/config";

/**
 * All formatting happens in the *location's* IANA time zone, so a visitor in
 * Prague looking at Tokyo sees Tokyo wall-clock times, DST included.
 * Formatter construction is expensive, hence the cache.
 */
const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(
  locale: Locale | "iso",
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale === "iso" ? "en-CA" : INTL_LOCALE[locale], {
      timeZone,
      ...options,
    });
    cache.set(key, f);
  }
  return f;
}

const ms = (unixSeconds: number) => new Date(unixSeconds * 1000);

/** `3:45 PM` / `15:45`. */
export function formatTime(unix: number, tz: string, locale: Locale): string {
  return formatter(locale, tz, { hour: "numeric", minute: "2-digit" }).format(ms(unix));
}

/** Compact hour label: `3 PM` / `15:00`. */
export function formatHour(unix: number, tz: string, locale: Locale): string {
  return locale === "en"
    ? formatter(locale, tz, { hour: "numeric" }).format(ms(unix))
    : formatTime(unix, tz, locale);
}

/** `Thursday, November 12` / `čtvrtek 12. listopadu`. */
export function formatDate(unix: number, tz: string, locale: Locale): string {
  return formatter(locale, tz, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(ms(unix));
}

export function formatWeekday(
  unix: number,
  tz: string,
  locale: Locale,
  style: "long" | "short" = "long"
): string {
  return formatter(locale, tz, { weekday: style }).format(ms(unix));
}

/** `Nov 12` / `12. 11.` */
export function formatDayMonth(unix: number, tz: string, locale: Locale): string {
  return formatter(locale, tz, { month: "short", day: "numeric" }).format(ms(unix));
}

/** `November 12` / `12. listopadu` */
export function formatLongDayMonth(unix: number, tz: string, locale: Locale): string {
  return formatter(locale, tz, { month: "long", day: "numeric" }).format(ms(unix));
}

/** `YYYY-MM-DD` in the location's calendar. */
export function dayKey(unix: number, tz: string): string {
  return formatter("iso", tz, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms(unix));
}

/** Hour of day (0-23) at the location. */
export function hourOfDay(unix: number, tz: string): number {
  const part = formatter("iso", tz, { hour: "numeric", hourCycle: "h23" })
    .formatToParts(ms(unix))
    .find((p) => p.type === "hour");
  return Number(part?.value ?? 0) % 24;
}

/** Abbreviated month: `Jun` / `čvn`. */
export function monthShort(month: number, locale: Locale): string {
  return formatter(locale, "UTC", { month: "short" })
    .format(new Date(Date.UTC(2024, month, 15)))
    .replace(/\.$/, "");
}

/** `Nov 12, 2026` / `12. 11. 2026` for absolute dates (UTC). */
export function formatCalendarDate(date: Date, locale: Locale): string {
  return formatter(locale, "UTC", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Duration in minutes → `9 h 12 min`. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
