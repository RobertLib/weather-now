/**
 * Text colour for a solid background: dark slate or white, whichever has the
 * higher WCAG contrast ratio. Badges coloured by level (AQI, UV, pollen) run
 * from green and yellow, where white text is unreadable (under 2:1), to red
 * and purple, where it works.
 */
const DARK = "#0f172a";
const LIGHT = "#ffffff";

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function textOn(background: string): string {
  return contrastRatio(background, DARK) >= contrastRatio(background, LIGHT) ? DARK : LIGHT;
}

/** Inline style for a solid badge: the colour plus readable text on it. */
export function badgeStyle(background: string): { backgroundColor: string; color: string } {
  return { backgroundColor: background, color: textOn(background) };
}
