"use client";

import { useId } from "react";
import { ConditionKind, conditionKind } from "@/lib/conditions";

interface WeatherIconProps {
  /** WMO weather code. */
  code: number;
  /** Draw the moon instead of the sun. */
  night?: boolean;
  className?: string;
  /** Turn off the internal animations for dense lists. */
  animated?: boolean;
  title?: string;
}

/**
 * Hand-drawn animated weather glyphs. Replaces the bitmap icons weather
 * services usually serve so the artwork scales, matches the palette and moves a little.
 */
export default function WeatherIcon({
  code,
  night = false,
  className = "w-16 h-16",
  animated = true,
  title,
}: WeatherIconProps) {
  const uid = useId().replace(/:/g, "");
  const kind = conditionKind(code);

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={`${uid}-moon`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={`${uid}-cloud`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={`${uid}-cloud-dark`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`${uid}-drop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {renderScene(kind, night, uid, animated)}
    </svg>
  );
}

function renderScene(
  kind: ConditionKind,
  night: boolean,
  uid: string,
  animated: boolean
) {
  const spin = animated ? "animate-spin-slow" : "";
  const bob = animated ? "animate-float" : "";

  switch (kind) {
    case "clear":
      return night ? (
        <g>
          <Moon uid={uid} cx={32} cy={32} r={14} className={bob} />
          <Stars uid={uid} animated={animated} />
        </g>
      ) : (
        <g>
          <circle cx="32" cy="32" r="22" fill={`url(#${uid}-glow)`} />
          <Sun uid={uid} cx={32} cy={32} r={12} spinClass={spin} />
        </g>
      );

    case "partly":
      return night ? (
        <g>
          <Moon uid={uid} cx={39} cy={22} r={11} className={bob} />
          <Stars uid={uid} animated={animated} compact />
          <Cloud uid={uid} x={8} y={28} scale={0.92} dark />
        </g>
      ) : (
        <g>
          <circle cx="40" cy="22" r="16" fill={`url(#${uid}-glow)`} />
          <Sun uid={uid} cx={40} cy={22} r={9.5} spinClass={spin} />
          <Cloud uid={uid} x={7} y={28} scale={0.95} />
        </g>
      );

    case "clouds":
      return (
        <g>
          <Cloud uid={uid} x={16} y={17} scale={0.62} dark opacity={0.75} />
          <Cloud uid={uid} x={5} y={27} scale={1.02} />
        </g>
      );

    case "fog":
      return (
        <g>
          <Cloud uid={uid} x={6} y={17} scale={0.95} opacity={0.85} />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={10}
              y={40 + i * 7}
              width={44 - i * 6}
              height="3.4"
              rx="1.7"
              fill="#e2e8f0"
              opacity={0.85 - i * 0.18}
              className={animated ? "animate-drift-fast" : ""}
              style={animated ? { animationDelay: `${i * -9}s` } : undefined}
            />
          ))}
        </g>
      );

    case "drizzle":
    case "rain":
      return (
        <g>
          <Cloud uid={uid} x={5} y={16} scale={1} dark={kind === "rain"} />
          {(kind === "rain" ? [0, 1, 2, 3] : [0, 1, 2]).map((i, _, arr) => (
            <Drop
              key={i}
              uid={uid}
              x={16 + i * (36 / Math.max(1, arr.length - 1))}
              delay={i * 0.22}
              animated={animated}
              long={kind === "rain"}
            />
          ))}
        </g>
      );

    case "thunder":
      return (
        <g>
          <Cloud uid={uid} x={5} y={14} scale={1} dark />
          <path
            d="M33 36 L25 50 h6 l-3 11 12-16 h-7 l4-9 z"
            fill="#facc15"
            stroke="#f59e0b"
            strokeWidth="0.8"
            className={animated ? "animate-flash" : ""}
            style={{ animationDuration: "3.2s" }}
          />
          <Drop uid={uid} x={15} delay={0.1} animated={animated} long />
          <Drop uid={uid} x={49} delay={0.45} animated={animated} long />
        </g>
      );

    case "snow":
      return (
        <g>
          <Cloud uid={uid} x={5} y={16} scale={1} />
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className={animated ? "animate-float" : ""}
              style={
                animated
                  ? { animationDelay: `${i * 0.6}s`, animationDuration: "3.2s" }
                  : undefined
              }
            >
              <Flake cx={17 + i * 15} cy={45 + (i % 2) * 6} />
            </g>
          ))}
        </g>
      );
  }
}

function Sun({
  uid,
  cx,
  cy,
  r,
  spinClass,
}: {
  uid: string;
  cx: number;
  cy: number;
  r: number;
  spinClass: string;
}) {
  return (
    <g>
      <g
        className={spinClass}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        stroke={`url(#${uid}-sun)`}
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          const inner = r + 3.5;
          const outer = r + 8;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * inner}
              y1={cy + Math.sin(a) * inner}
              x2={cx + Math.cos(a) * outer}
              y2={cy + Math.sin(a) * outer}
            />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-sun)`} />
    </g>
  );
}

function Moon({
  uid,
  cx,
  cy,
  r,
  className = "",
}: {
  uid: string;
  cx: number;
  cy: number;
  r: number;
  className?: string;
}) {
  const mask = `${uid}-moon-mask`;
  return (
    <g className={className}>
      <mask id={mask}>
        <rect x="0" y="0" width="64" height="64" fill="black" />
        <circle cx={cx} cy={cy} r={r} fill="white" />
        <circle cx={cx + r * 0.62} cy={cy - r * 0.55} r={r * 0.92} fill="black" />
      </mask>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#${uid}-moon)`}
        mask={`url(#${mask})`}
      />
    </g>
  );
}

function Stars({
  uid,
  animated,
  compact = false,
}: {
  uid: string;
  animated: boolean;
  compact?: boolean;
}) {
  const points = compact
    ? [
        [13, 14, 1.3],
        [22, 9, 1],
      ]
    : [
        [12, 16, 1.4],
        [50, 14, 1.1],
        [17, 46, 1],
        [52, 44, 1.3],
      ];

  return (
    <g fill="#fef9c3">
      {points.map(([x, y, r], i) => (
        <circle
          key={`${uid}-star-${i}`}
          cx={x}
          cy={y}
          r={r}
          className={animated ? "animate-twinkle" : ""}
          style={animated ? { animationDelay: `${i * 0.8}s` } : undefined}
        />
      ))}
    </g>
  );
}

function Cloud({
  uid,
  x,
  y,
  scale = 1,
  dark = false,
  opacity = 1,
}: {
  uid: string;
  x: number;
  y: number;
  scale?: number;
  dark?: boolean;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path
        d="M12 26 a10 10 0 0 1 1.4 -19.9 a13 13 0 0 1 24.3 3.2 a8.6 8.6 0 0 1 -1.7 16.7 z"
        fill={`url(#${uid}-cloud${dark ? "-dark" : ""})`}
      />
    </g>
  );
}

function Drop({
  uid,
  x,
  delay,
  animated,
  long = false,
}: {
  uid: string;
  x: number;
  delay: number;
  animated: boolean;
  long?: boolean;
}) {
  return (
    <g
      className={animated ? "animate-float" : ""}
      style={
        animated
          ? { animationDelay: `${delay}s`, animationDuration: "1.6s" }
          : undefined
      }
    >
      <path
        d={
          long
            ? `M${x} 40 q2.6 5.2 0 8.4 q-2.6 -3.2 0 -8.4 z`
            : `M${x} 41 q2.2 4 0 6.4 q-2.2 -2.4 0 -6.4 z`
        }
        fill={`url(#${uid}-drop)`}
      />
      <path
        d={
          long
            ? `M${x} 51 q2.2 4.4 0 7.1 q-2.2 -2.7 0 -7.1 z`
            : `M${x} 51 q1.8 3.4 0 5.4 q-1.8 -2 0 -5.4 z`
        }
        fill={`url(#${uid}-drop)`}
        opacity="0.6"
      />
    </g>
  );
}

function Flake({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g
      stroke="#e0f2fe"
      strokeWidth="1.5"
      strokeLinecap="round"
      transform={`translate(${cx} ${cy})`}
    >
      <line x1="-4" y1="0" x2="4" y2="0" />
      <line x1="0" y1="-4" x2="0" y2="4" />
      <line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" />
      <line x1="-2.8" y1="2.8" x2="2.8" y2="-2.8" />
    </g>
  );
}
