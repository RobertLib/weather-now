"use client";

import { useId, useState } from "react";
import { ForecastItem } from "@/types/weather";
import { SkyTheme } from "@/lib/conditions";
import { UnitSystem, convertTemp, formatTemp } from "@/lib/units";
import { formatLocalHour, formatLocalWeekday, localDayKey } from "@/lib/datetime";

const W = 760;
const H = 260;
const PAD = { top: 34, right: 26, bottom: 54, left: 26 };

interface TempChartProps {
  items: ForecastItem[];
  tz: number;
  units: UnitSystem;
  theme: SkyTheme;
}

/**
 * Temperature curve with a "feels like" trace and precipitation-chance bars.
 * Hand-rolled SVG — no charting dependency.
 */
export default function TempChart({ items, tz, units, theme }: TempChartProps) {
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);

  const points = items.slice(0, 14);
  if (points.length < 2) return null;

  const temps = points.map((p) => convertTemp(p.main.temp, units));
  const feels = points.map((p) => convertTemp(p.main.feels_like, units));
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
    <div className="scroll-strip -mx-1 px-1">
      <div style={{ minWidth: 600 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Temperature trend from ${formatTemp(
            Math.min(...points.map((p) => p.main.temp)),
            units
          )} to ${formatTemp(
            Math.max(...points.map((p) => p.main.temp)),
            units
          )} over the next ${points.length * 3} hours`}
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
            if (localDayKey(p.dt, tz) === localDayKey(points[i - 1].dt, tz))
              return null;
            return (
              <g key={`sep-${p.dt}`}>
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
                  {formatLocalWeekday(p.dt, tz, "short")}
                </text>
              </g>
            );
          })}

          {/* Precipitation chance */}
          {points.map((p, i) => {
            const h = p.pop * 34;
            return (
              <rect
                key={`pop-${p.dt}`}
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
            <g key={p.dt}>
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
                {Math.round(temps[i])}°
              </text>
              <text
                x={x(i)}
                y={H - 26}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-medium dark:fill-slate-400"
              >
                {formatLocalHour(p.dt, tz)}
              </text>
              {p.pop >= 0.15 && (
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
                  W - 116,
                  Math.max(8, x(active) - 58)
                )} 2)`}
              >
                <rect
                  width="116"
                  height="26"
                  rx="8"
                  className="fill-slate-900/85 dark:fill-slate-100/90"
                />
                <text
                  x="58"
                  y="17"
                  textAnchor="middle"
                  className="fill-white text-[11px] font-semibold dark:fill-slate-900"
                >
                  {formatLocalHour(points[active].dt, tz)} ·{" "}
                  {Math.round(temps[active])}° · feels{" "}
                  {Math.round(feels[active])}°
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-[3px] w-5 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          Temperature
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-[3px] w-5 rounded-full opacity-60"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${theme.accent} 0 4px, transparent 4px 8px)`,
            }}
          />
          Feels like
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-400/70" />
          Chance of precipitation
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
