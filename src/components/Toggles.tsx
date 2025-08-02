"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { UnitSystem } from "@/lib/units";
import { ThemePreference } from "@/hooks/useTheme";

/** °C/km-h vs °F/mph. */
export function UnitToggle({
  units,
  onChange,
}: {
  units: UnitSystem;
  onChange: (units: UnitSystem) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md"
      role="group"
      aria-label="Measurement units"
    >
      {(["metric", "imperial"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={units === option}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
            units === option
              ? "bg-white text-slate-900 shadow"
              : "text-white/80 hover:text-white"
          }`}
        >
          {option === "metric" ? "°C" : "°F"}
        </button>
      ))}
    </div>
  );
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "Match system theme", Icon: Monitor },
];

export function ThemeToggle({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md"
      role="group"
      aria-label="Colour theme"
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={preference === value}
          aria-label={label}
          title={label}
          className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
            preference === value
              ? "bg-white text-slate-900 shadow"
              : "text-white/80 hover:text-white"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
