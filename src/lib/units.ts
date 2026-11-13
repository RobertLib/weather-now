export type UnitSystem = "metric" | "imperial";

export function convertTemp(celsius: number, units: UnitSystem): number {
  return units === "metric" ? celsius : celsius * (9 / 5) + 32;
}

export function tempUnit(units: UnitSystem): string {
  return units === "metric" ? "°C" : "°F";
}

/**
 * A whole number with a real minus sign (U+2212) instead of a hyphen, which
 * typesets better and is read as "minus" by screen readers. `-0` prints as `0`.
 */
export function signed(n: number): string {
  return n < 0 ? `\u2212${-n}` : String(Math.abs(n));
}

/** Rounded temperature with a degree sign, e.g. `21°`, `−3°`. */
export function formatTemp(celsius: number, units: UnitSystem): string {
  return `${signed(Math.round(convertTemp(celsius, units)))}°`;
}

/** A temperature *difference* (no 32° offset), e.g. a 10 °C swing is `18°` in °F. */
export function formatTempDelta(celsius: number, units: UnitSystem): string {
  return `${Math.round(units === "metric" ? celsius : celsius * (9 / 5))}°`;
}

export function convertSpeed(metersPerSecond: number, units: UnitSystem) {
  return units === "metric"
    ? metersPerSecond * 3.6
    : metersPerSecond * 2.236936;
}

export function speedUnit(units: UnitSystem): string {
  return units === "metric" ? "km/h" : "mph";
}

/** Rounded speed with its unit, e.g. `40 km/h` / `25 mph`. */
export function formatSpeed(metersPerSecond: number, units: UnitSystem): string {
  return `${Math.round(convertSpeed(metersPerSecond, units))} ${speedUnit(units)}`;
}

export function convertDistance(meters: number, units: UnitSystem) {
  return units === "metric" ? meters / 1000 : meters / 1609.344;
}

export function distanceUnit(units: UnitSystem): string {
  return units === "metric" ? "km" : "mi";
}

export function convertPressure(hPa: number, units: UnitSystem) {
  return units === "metric" ? hPa : hPa * 0.02953;
}

export function pressureUnit(units: UnitSystem): string {
  return units === "metric" ? "hPa" : "inHg";
}

export function formatPressure(hPa: number, units: UnitSystem): string {
  const value = convertPressure(hPa, units);
  return units === "metric" ? String(Math.round(value)) : value.toFixed(2);
}

/** 0-15 index into a 16-point compass rose (N, NNE, NE, …). */
export function compassIndex(degrees: number): number {
  return Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
}

/** 0 calm … 6 storm; the labels live in the dictionaries. */
export function windLevel(metersPerSecond: number): number {
  const kmh = metersPerSecond * 3.6;
  if (kmh < 1) return 0;
  if (kmh < 12) return 1;
  if (kmh < 29) return 2;
  if (kmh < 50) return 3;
  if (kmh < 75) return 4;
  if (kmh < 103) return 5;
  return 6;
}
