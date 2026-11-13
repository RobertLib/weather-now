"use client";

import { useId } from "react";

/** Circular progress ring with the value in the middle. */
export function RingGauge({
  value,
  max = 100,
  color,
  label,
  size = 76,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
  size?: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, value / max));

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="7"
        className="stroke-slate-900/10 dark:stroke-white/10"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
      <text
        x="40"
        y="44"
        textAnchor="middle"
        className="fill-slate-800 text-[1.15rem] font-bold dark:fill-slate-100"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label}
      </text>
    </svg>
  );
}

/** Wind rose — the arrow points the way the wind is blowing. */
export function CompassGauge({
  degrees,
  color,
  north = "N",
  size = 76,
}: {
  degrees: number;
  color: string;
  /** Label of the north mark in the page's language. */
  north?: string;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        strokeWidth="1.5"
        className="stroke-slate-900/15 dark:stroke-white/15"
      />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        const inner = i % 2 === 0 ? 27 : 30;
        return (
          <line
            key={i}
            x1={40 + Math.sin(a) * inner}
            y1={40 - Math.cos(a) * inner}
            x2={40 + Math.sin(a) * 33}
            y2={40 - Math.cos(a) * 33}
            strokeWidth={i % 2 === 0 ? 2 : 1}
            strokeLinecap="round"
            className="stroke-slate-900/25 dark:stroke-white/25"
          />
        );
      })}
      <text
        x="40"
        y="15"
        textAnchor="middle"
        className="fill-slate-500 text-[0.55rem] font-bold dark:fill-slate-400"
      >
        {north}
      </text>
      <g
        transform={`rotate(${degrees + 180} 40 40)`}
        style={{ transition: "transform 700ms ease-out" }}
      >
        <path
          d="M40 20 L46 45 L40 41 L34 45 Z"
          fill={color}
          stroke={color}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="40" cy="40" r="3" fill={color} />
    </svg>
  );
}

/** Half-circle gauge with a needle, used for pressure. */
export function ArcGauge({
  value,
  min,
  max,
  color,
  label,
  size = 76,
}: {
  value: number;
  min: number;
  max: number;
  color: string;
  label: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -90 + ratio * 180;
  const arc = (r: number) => `M ${40 - r} 46 A ${r} ${r} 0 0 1 ${40 + r} 46`;

  return (
    <svg viewBox="0 0 80 62" width={size} height={size * 0.78} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-arc`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d={arc(30)}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        className="stroke-slate-900/10 dark:stroke-white/10"
      />
      <path
        d={arc(30)}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        stroke={`url(#${uid}-arc)`}
        opacity="0.65"
      />
      <g
        transform={`rotate(${angle} 40 46)`}
        style={{ transition: "transform 700ms ease-out" }}
      >
        <line
          x1="40"
          y1="46"
          x2="40"
          y2="20"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-slate-700 dark:stroke-slate-200"
        />
      </g>
      <circle cx="40" cy="46" r="3.5" className="fill-slate-700 dark:fill-slate-200" />
      <text
        x="40"
        y="60"
        textAnchor="middle"
        className="fill-slate-800 text-[0.62rem] font-bold dark:fill-slate-100"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label}
      </text>
    </svg>
  );
}

/** Segmented horizontal meter — visibility, sun strength, activity scores. */
export function SegmentGauge({
  ratio,
  segments = 10,
  color,
}: {
  ratio: number;
  segments?: number;
  color: string;
}) {
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * segments);
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full transition-all duration-500 sm:w-2"
          style={{
            height: `${14 + i * 2.4}px`,
            backgroundColor: i < filled ? color : undefined,
            opacity: i < filled ? 1 : 0.18,
            ...(i < filled ? {} : { backgroundColor: "currentColor" }),
          }}
        />
      ))}
    </div>
  );
}

/** Thin progress bar used inside compact rows. */
export function BarGauge({
  ratio,
  color,
  className = "",
}: {
  ratio: number;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10 ${className}`}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
