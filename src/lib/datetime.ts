/**
 * OpenWeather returns UTC timestamps plus the location's UTC offset in seconds.
 * Shifting the timestamp by that offset and then formatting in UTC yields the
 * wall-clock time *at the location*, not in the visitor's own time zone.
 */
function shifted(unixSeconds: number, tzOffsetSeconds: number): Date {
  return new Date((unixSeconds + tzOffsetSeconds) * 1000);
}

const LOCALE = "en-US";

export function formatLocalTime(
  unixSeconds: number,
  tzOffsetSeconds: number
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Compact label for the hourly strip, e.g. `3 PM`. */
export function formatLocalHour(
  unixSeconds: number,
  tzOffsetSeconds: number
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toLocaleTimeString(LOCALE, {
    hour: "numeric",
    timeZone: "UTC",
  });
}

export function formatLocalDate(
  unixSeconds: number,
  tzOffsetSeconds: number
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatLocalWeekday(
  unixSeconds: number,
  tzOffsetSeconds: number,
  style: "long" | "short" = "long"
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toLocaleDateString(LOCALE, {
    weekday: style,
    timeZone: "UTC",
  });
}

export function formatLocalDayMonth(
  unixSeconds: number,
  tzOffsetSeconds: number
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** `YYYY-MM-DD` key in the location's own calendar day. */
export function localDayKey(
  unixSeconds: number,
  tzOffsetSeconds: number
): string {
  return shifted(unixSeconds, tzOffsetSeconds).toISOString().slice(0, 10);
}

/** Hour of day (0-23) at the location. */
export function localHourOfDay(
  unixSeconds: number,
  tzOffsetSeconds: number
): number {
  return shifted(unixSeconds, tzOffsetSeconds).getUTCHours();
}

/** "Updated 4 min ago" style label. */
export function relativeTime(from: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}
