"use client";

import { useId, useState } from "react";
import { HourlyPoint } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import { UnitSystem, convertTemp, formatTemp, signed } from "@/lib/units";
import { dayKey, formatHour, formatWeekday } from "@/lib/datetime";
import { useI18n } from "@/i18n/client";

const W = 760;
const H = 260;
const PAD = { top: 34, right: 26, bottom: 54, left: 26 };

interface TempChartProps {
  items: HourlyPoint[];
  tz: string;
  /** Hours between plotted points; the strip keeps every hour, the chart thins them. */
  step?: number;
  units: UnitSystem;
  theme: SkyTheme;
}

/**
 * Temperature curve with a "feels like" trace and precipitation-chance bars.
 * Hand-rolled SVG — no charting dependency.
 */
export default function TempChart({ items, tz, units, theme, step: every = 2 }: TempChartProps) {
  const { t, locale } = useI18n();
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);

  const points = items.filter((_, i) => i % every === 0).slice(0, 16);
  if (points.length < 2) return null;

  const temps = points.map((p) => convertTemp(p.temp, units));
  const feels = points.map((p) => convertTemp(p.feelsLike, units));
  const lo = Math.min(...temps, ...feels);
  const hi = Math.max(...temps, ...feels);
  const span = Math.max(4, hi - lo);
  const min = lo - span * 0.25;
  const max = hi + span * 0.3;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i * innerW) / (points.length - 1);
  const y = (t: number) => PAD.top + innerH * (1 - (t - min) / (max - min));

  const tempPath = smoothPath(temps.map((t, i) => [x(i), y(t)]));
  const feelsPath = smoothPath(feels.map((t, i) => [x(i), y(t)]));
  const areaPath = `${tempPath} L ${x(points.length - 1)} ${PAD.top + innerH} L ${PAD.left} ${
    PAD.top + innerH
  } Z`;

  const baseline = PAD.top + innerH;
  const step = innerW / (points.length - 1);

  return (
    <div className="scroll-strip -mx-1 scroll-px-1 px-1">
      <div style={{ minWidth: 600 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={t.chart.aria(
            formatTemp(Math.min(...points.map((p) => p.temp)), units),
            formatTemp(Math.max(...points.map((p) => p.temp)), units),
            points.length * every
          )}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.42" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor={theme.accent} />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>

          {/* Day boundaries */}
          {points.map((p, i) => {
            if (i === 0) return null;
            if (dayKey(p.time, tz) === dayKey(points[i - 1].time, tz))
              return null;
            return (
              <g key={`sep-${p.time}`}>
                <line
                  x1={x(i) - step / 2}
                  y1={PAD.top - 14}
                  x2={x(i) - step / 2}
                  y2={baseline + 26}
                  strokeDasharray="3 5"
                  className="stroke-slate-900/20 dark:stroke-white/20"
                />
                <text
                  x={x(i) - step / 2 + 6}
                  y={PAD.top - 18}
                  className="fill-slate-500 text-[11px] font-semibold dark:fill-slate-400"
                >
                  {formatWeekday(p.time, tz, locale, "short")}
                </text>
              </g>
            );
          })}

          {/* Precipitation chance */}
          {points.map((p, i) => {
            // No bar where the model gives no probability (unknown, not 0 %).
            if (p.pop === null) return null;
            const h = p.pop * 34;
            return (
              <rect
                key={`pop-${p.time}`}
                x={x(i) - Math.min(13, step * 0.28)}
                y={baseline + 24 - h}
                width={Math.min(26, step * 0.56)}
                height={Math.max(1.5, h)}
                rx="3"
                fill="#38bdf8"
                opacity={p.pop < 0.05 ? 0.18 : 0.45 + p.pop * 0.5}
              />
            );
          })}

          <line
            x1={PAD.left - 10}
            y1={baseline + 24}
            x2={W - PAD.right + 10}
            y2={baseline + 24}
            className="stroke-slate-900/12 dark:stroke-white/12"
          />

          {/* Curves */}
          <path d={areaPath} fill={`url(#${uid}-area)`} />
          <path
            d={feelsPath}
            fill="none"
            stroke={theme.accent}
            strokeWidth="1.8"
            strokeDasharray="4 5"
            opacity="0.55"
          />
          <path
            d={tempPath}
            fill="none"
            stroke={`url(#${uid}-line)`}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points, labels, hit areas */}
          {points.map((p, i) => (
            <g key={p.time}>
              <circle
                cx={x(i)}
                cy={y(temps[i])}
                r={active === i ? 6 : 4}
                fill="#fff"
                stroke={theme.accent}
                strokeWidth="2.5"
                style={{ transition: "r 150ms ease-out" }}
              />
              <text
                x={x(i)}
                y={y(temps[i]) - 13}
                textAnchor="middle"
                className="fill-slate-800 text-[12.5px] font-bold dark:fill-slate-100"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {signed(Math.round(temps[i]))}°
              </text>
              <text
                x={x(i)}
                y={H - 26}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-medium dark:fill-slate-400"
              >
                {formatHour(p.time, tz, locale)}
              </text>
              {p.pop !== null && p.pop >= 0.15 && (
                <text
                  x={x(i)}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-sky-600 text-[10px] font-semibold dark:fill-sky-300"
                >
                  {Math.round(p.pop * 100)}%
                </text>
              )}
              <rect
                x={x(i) - step / 2}
                y={0}
                width={step}
                height={H}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                tabIndex={-1}
                style={{ cursor: "pointer" }}
              />
            </g>
          ))}

          {/* Hover readout */}
          {active !== null && (
            <g pointerEvents="none">
              <line
                x1={x(active)}
                y1={PAD.top - 12}
                x2={x(active)}
                y2={baseline + 24}
                stroke={theme.accent}
                strokeWidth="1.5"
                opacity="0.5"
              />
              <g
                transform={`translate(${Math.min(
                  W - 150,
                  Math.max(8, x(active) - 75)
                )} 2)`}
              >
                <rect
                  width="150"
                  height="26"
                  rx="8"
                  className="fill-slate-900/85 dark:fill-slate-100/90"
                />
                <text
                  x="75"
                  y="17"
                  textAnchor="middle"
                  className="fill-white text-[11px] font-semibold dark:fill-slate-900"
                >
                  {formatHour(points[active].time, tz, locale)} ·{" "}
                  {signed(Math.round(temps[active]))}° · {t.chart.feels}{" "}
                  {signed(Math.round(feels[active]))}°
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0.75 w-5 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          {t.chart.temperature}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0.75 w-5 rounded-full opacity-60"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${theme.accent} 0 4px, transparent 4px 8px)`,
            }}
          />
          {t.chart.feelsLike}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-400/70" />
          {t.chart.pop}
        </span>
      </div>
    </div>
  );
}

/** Catmull-Rom → cubic bezier, so the curve stays smooth without overshooting. */
function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;

    d += ` C ${p1[0] + (p2[0] - p0[0]) * t} ${p1[1] + (p2[1] - p0[1]) * t}, ${
      p2[0] - (p3[0] - p1[0]) * t
    } ${p2[1] - (p3[1] - p1[1]) * t}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
