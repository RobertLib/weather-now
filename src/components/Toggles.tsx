"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { UnitSystem } from "@/lib/units";
import { useTheme } from "@/hooks/useTheme";
import { useUnits } from "@/hooks/useUnits";
import { useI18n } from "@/i18n/client";

const pill =
  "flex items-center gap-0.5 rounded-full border border-white/25 bg-white/15 p-0.5 backdrop-blur-md";

/** °C/km-h vs °F/mph, shared by every page through localStorage. */
export function UnitToggle() {
  const { t } = useI18n();
  const [units, setUnits] = useUnits();
  return (
    <div className={pill} role="group" aria-label={t.common.units}>
      {(["metric", "imperial"] as UnitSystem[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setUnits(option)}
          aria-pressed={units === option}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
            units === option ? "bg-white text-slate-900 shadow" : "text-white/80 hover:text-white"
          }`}
        >
          {option === "metric" ? "°C" : "°F"}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  const { preference, setPreference } = useTheme();
  const options = [
    { value: "light", label: t.common.themeLight, Icon: Sun },
    { value: "dark", label: t.common.themeDark, Icon: Moon },
    { value: "system", label: t.common.themeSystem, Icon: Monitor },
  ] as const;

  return (
    <div className={pill} role="group" aria-label={t.common.theme}>
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPreference(value)}
          aria-pressed={preference === value}
          aria-label={label}
          title={label}
          className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
            preference === value ? "bg-white text-slate-900 shadow" : "text-white/80 hover:text-white"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
