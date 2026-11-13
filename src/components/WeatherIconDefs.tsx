/**
 * Gradients shared by every `WeatherIcon` on the page, rendered once in each
 * root layout. Inline SVGs can reference `url(#id)` from anywhere in the
 * document, so the dozens of icons on a city or country page don't each carry
 * their own copy (about 1 kB apiece).
 *
 * Hidden with zero size rather than `display: none`, which would stop some
 * browsers from painting the gradients.
 */
export const ICON_GRADIENT = {
  sun: "wi-sun",
  moon: "wi-moon",
  cloud: "wi-cloud",
  cloudDark: "wi-cloud-dark",
  drop: "wi-drop",
  glow: "wi-glow",
} as const;

export default function WeatherIconDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id={ICON_GRADIENT.sun} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={ICON_GRADIENT.moon} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={ICON_GRADIENT.cloud} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={ICON_GRADIENT.cloudDark} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={ICON_GRADIENT.drop} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id={ICON_GRADIENT.glow}>
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
