"use client";

import { useId } from "react";
import { Moon, Sunrise, Sunset } from "lucide-react";
import { SkyTheme } from "@/lib/conditions";
import { DaylightInfo, moonPhase } from "@/lib/astro";
import { formatDuration, formatTime } from "@/lib/datetime";
import { useI18n } from "@/i18n/client";
import Card from "./Card";

interface SunMoonCardProps {
  sunrise: number;
  sunset: number;
  /** Unix seconds used for the moon phase. */
  time: number;
  tz: string;
  daylight: DaylightInfo;
  theme: SkyTheme;
  delay?: number;
}

export default function SunMoonCard({
  sunrise,
  sunset,
  time,
  tz,
  daylight,
  theme,
  delay = 0,
}: SunMoonCardProps) {
  const { t, locale } = useI18n();
  const moon = moonPhase(time);

  return (
    <Card
      title={t.sun.title}
      subtitle={t.sun.subtitle(formatDuration(daylight.lengthMinutes))}
      icon={<Sunrise className="h-4 w-4" aria-hidden="true" />}
      delay={delay}
    >
      <SunArc daylight={daylight} theme={theme} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Slot
          icon={<Sunrise className="h-4 w-4 text-amber-500" aria-hidden="true" />}
          label={t.common.sunrise}
          value={formatTime(sunrise, tz, locale)}
        />
        <Slot
          icon={<Sunset className="h-4 w-4 text-orange-500" aria-hidden="true" />}
          label={t.common.sunset}
          value={formatTime(sunset, tz, locale)}
        />
      </div>

      <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
        {t.sun.next(daylight.nextEvent)}{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {formatDuration(daylight.minutesToNextEvent)}
        </span>
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-900/8 pt-4 dark:border-white/10">
        <MoonDisc fraction={moon.fraction} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Moon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {t.sun.moonPhases[moon.phase]}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.sun.illuminated(Math.round(moon.illumination * 100))} ·{" "}
            {moon.daysToFull === 0 ? t.sun.fullTonight : t.sun.fullIn(moon.daysToFull)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SunArc({
  daylight,
  theme,
}: {
  daylight: DaylightInfo;
  theme: SkyTheme;
}) {
  const uid = useId().replace(/:/g, "");
  const w = 260;
  const h = 96;
  const r = 96;
  const cx = w / 2;
  const cy = h + 6;

  const angle = Math.PI * (1 - daylight.progress);
  const px = cx + Math.cos(angle) * r;
  const py = cy - Math.sin(angle) * r;

  return (
    <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>

      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        strokeWidth="2"
        strokeDasharray="4 6"
        className="stroke-slate-900/20 dark:stroke-white/20"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${px} ${py}`}
        fill="none"
        stroke={`url(#${uid}-sky)`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1={cx - r - 6}
        y1={cy}
        x2={cx + r + 6}
        y2={cy}
        className="stroke-slate-900/15 dark:stroke-white/15"
      />

      {daylight.isDay ? (
        <g>
          <circle cx={px} cy={py} r="11" fill="#fbbf24" opacity="0.28" />
          <circle cx={px} cy={py} r="6.5" fill="#f59e0b" />
        </g>
      ) : (
        <g>
          <circle
            cx={daylight.progress >= 1 ? cx + r : cx - r}
            cy={cy}
            r="6"
            fill={theme.accent}
            opacity="0.7"
          />
        </g>
      )}
    </svg>
  );
}

function MoonDisc({ fraction }: { fraction: number }) {
  const uid = useId().replace(/:/g, "");
  const r = 20;
  const cx = 24;
  const cy = 24;

  /**
   * The lit area is a semicircle on the illuminated limb closed off by a
   * half-ellipse terminator. Its x-radius shrinks to 0 at the quarters and
   * grows back to r at new/full moon, where it either cancels the semicircle
   * (new) or completes the disc (full).
   */
  const cosPhase = Math.cos(2 * Math.PI * fraction);
  const rx = Math.abs(cosPhase) * r;
  const waxing = fraction < 0.5;
  const outerSweep = waxing ? 1 : 0;
  const innerSweep = waxing ? (cosPhase > 0 ? 0 : 1) : cosPhase > 0 ? 1 : 0;

  const litPath =
    `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r}` +
    ` A ${rx} ${r} 0 0 ${innerSweep} ${cx} ${cy - r} Z`;

  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-lit`} cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className="fill-slate-800/25 dark:fill-slate-950/60"
      />
      <path d={litPath} fill={`url(#${uid}-lit)`} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth="1"
        className="stroke-slate-900/20 dark:stroke-white/20"
      />
    </svg>
  );
}

function Slot({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-soft rounded-xl px-3 py-2">
      <p className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {icon}
        {label}
      </p>
      <p className="tabular text-sm font-bold">{value}</p>
    </div>
  );
}
