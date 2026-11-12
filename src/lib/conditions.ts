export type ConditionKind =
  | "clear"
  | "partly"
  | "clouds"
  | "drizzle"
  | "rain"
  | "thunder"
  | "snow"
  | "fog";

/**
 * Map a WMO weather interpretation code (as used by Open-Meteo) to one of the
 * eight visual conditions the artwork and backdrops know how to draw.
 */
export function conditionKind(code: number): ConditionKind {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "clouds";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "clouds";
}

/** Codes that mean something is falling from the sky. */
export function isWet(code: number): boolean {
  const kind = conditionKind(code);
  return kind === "drizzle" || kind === "rain" || kind === "thunder" || kind === "snow";
}

export interface SkyTheme {
  kind: ConditionKind;
  night: boolean;
  /** Vertical gradient stops for the page backdrop, top → bottom. */
  stops: [string, string, string];
  /** Tint used for the hero card gradient. */
  hero: [string, string];
  /** Accent colour for highlights, charts and focus rings. */
  accent: string;
}

const DAY: Record<ConditionKind, Omit<SkyTheme, "kind" | "night">> = {
  clear: {
    stops: ["#0284c7", "#38bdf8", "#bae6fd"],
    hero: ["#0369a1", "#0ea5e9"],
    accent: "#0284c7",
  },
  partly: {
    stops: ["#1d4ed8", "#60a5fa", "#dbeafe"],
    hero: ["#1e40af", "#3b82f6"],
    accent: "#2563eb",
  },
  clouds: {
    stops: ["#475569", "#8ba0b8", "#dbe3ec"],
    hero: ["#334155", "#64748b"],
    accent: "#475569",
  },
  drizzle: {
    stops: ["#2a4a68", "#5c85a8", "#c3d6e4"],
    hero: ["#1e3a52", "#3f6d94"],
    accent: "#0e7490",
  },
  rain: {
    stops: ["#1e3a5f", "#3b6ea5", "#a8c4dc"],
    hero: ["#172e4d", "#2f6094"],
    accent: "#0369a1",
  },
  thunder: {
    stops: ["#241b4b", "#4338ca", "#a5b4fc"],
    hero: ["#1e1b4b", "#4c1d95"],
    accent: "#6d28d9",
  },
  snow: {
    stops: ["#546b85", "#9db3c9", "#eef4fa"],
    hero: ["#3f5570", "#7d97b3"],
    accent: "#0e7490",
  },
  fog: {
    stops: ["#6b7684", "#9aa5b1", "#dee3e8"],
    hero: ["#525c68", "#8c97a3"],
    accent: "#57616d",
  },
};

const NIGHT: Record<ConditionKind, Omit<SkyTheme, "kind" | "night">> = {
  clear: {
    stops: ["#050817", "#141c46", "#33417f"],
    hero: ["#111a45", "#2b3873"],
    accent: "#818cf8",
  },
  partly: {
    stops: ["#070b21", "#18204a", "#38457d"],
    hero: ["#131b47", "#313e78"],
    accent: "#818cf8",
  },
  clouds: {
    stops: ["#0a1120", "#1e293b", "#42536b"],
    hero: ["#161f30", "#33415a"],
    accent: "#7dd3fc",
  },
  drizzle: {
    stops: ["#08111d", "#152438", "#33506e"],
    hero: ["#101c2c", "#274563"],
    accent: "#67e8f9",
  },
  rain: {
    stops: ["#060f1c", "#132339", "#2e4d70"],
    hero: ["#0e1c2e", "#254a70"],
    accent: "#38bdf8",
  },
  thunder: {
    stops: ["#06031a", "#1b1338", "#3f2a68"],
    hero: ["#150f30", "#38235c"],
    accent: "#a78bfa",
  },
  snow: {
    stops: ["#0b1220", "#243147", "#4c5f7c"],
    hero: ["#141d2e", "#3a4a64"],
    accent: "#93c5fd",
  },
  fog: {
    stops: ["#0d1218", "#232c38", "#48535f"],
    hero: ["#151c24", "#3a444f"],
    accent: "#94a3b8",
  },
};

export function skyTheme(kind: ConditionKind, night: boolean): SkyTheme {
  return { kind, night, ...(night ? NIGHT : DAY)[kind] };
}

export const DEFAULT_THEME = skyTheme("partly", false);

/** CSS gradient for the page backdrop. */
export function skyGradient(theme: SkyTheme): string {
  const [a, b, c] = theme.stops;
  return `linear-gradient(180deg, ${a} 0%, ${b} 48%, ${c} 100%)`;
}

export function heroGradient(theme: SkyTheme): string {
  const [a, b] = theme.hero;
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}
