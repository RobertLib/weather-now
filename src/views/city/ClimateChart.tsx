import { MonthNormals } from "@/lib/climate";

const W = 760;
const H = 320;
const PAD = { top: 30, right: 16, bottom: 34, left: 16 };
/** Share of the plot used by the temperature lines; precipitation sits below. */
const TEMP_SHARE = 0.6;

/**
 * Average high/low lines above a separate band of monthly precipitation bars.
 * Static SVG — the numbers are in the markup, so it reads without JavaScript.
 */
export default function ClimateChart({
  months,
  labels,
  highlight,
  ariaLabel,
}: {
  months: MonthNormals[];
  labels: string[];
  highlight?: number;
  ariaLabel: string;
}) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const col = innerW / 12;
  const x = (i: number) => PAD.left + col * (i + 0.5);

  const tempH = innerH * TEMP_SHARE;
  const lo = Math.min(...months.map((m) => m.lo));
  const hi = Math.max(...months.map((m) => m.hi));
  const span = Math.max(8, hi - lo);
  const tMin = lo - span * 0.12;
  const tMax = hi + span * 0.12;
  const y = (t: number) => PAD.top + tempH * (1 - (t - tMin) / (tMax - tMin));

  const base = PAD.top + innerH;
  const bandH = innerH - tempH - 34;
  const pMax = Math.max(20, ...months.map((m) => m.p));
  const barH = (p: number) => (p / pMax) * bandH;

  const line = (pick: (m: MonthNormals) => number) =>
    months.map((m, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(pick(m))}`).join(" ");

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[34rem]" role="img" aria-label={ariaLabel}>
        {highlight !== undefined && (
          <rect
            x={PAD.left + col * highlight + 2}
            y={PAD.top - 24}
            width={col - 4}
            height={innerH + 48}
            rx="10"
            className="fill-sky-500/10"
          />
        )}

        {months.map((m, i) => (
          <g key={`p${i}`}>
            <rect
              x={x(i) - col * 0.28}
              y={base - barH(m.p)}
              width={col * 0.56}
              height={Math.max(1.5, barH(m.p))}
              rx="4"
              fill="#38bdf8"
              opacity="0.45"
            />
            <text
              x={x(i)}
              y={base - barH(m.p) - 4}
              textAnchor="middle"
              className="fill-sky-700 text-[10px] dark:fill-sky-300"
            >
              {Math.round(m.p)}
            </text>
          </g>
        ))}

        <path d={line((m) => m.hi)} fill="none" stroke="#f97316" strokeWidth="3" strokeLinejoin="round" />
        <path d={line((m) => m.lo)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinejoin="round" />

        {months.map((m, i) => (
          <g key={`t${i}`}>
            <circle cx={x(i)} cy={y(m.hi)} r="4" fill="#fff" stroke="#f97316" strokeWidth="2.5" />
            <text x={x(i)} y={y(m.hi) - 9} textAnchor="middle" className="fill-slate-800 text-[11px] font-bold dark:fill-slate-100">
              {Math.round(m.hi)}°
            </text>
            <circle cx={x(i)} cy={y(m.lo)} r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2.5" />
            <text x={x(i)} y={y(m.lo) + 17} textAnchor="middle" className="fill-slate-600 text-[11px] dark:fill-slate-300">
              {Math.round(m.lo)}°
            </text>
            <text
              x={x(i)}
              y={H - 14}
              textAnchor="middle"
              className={`text-[11px] ${i === highlight ? "fill-sky-700 font-bold dark:fill-sky-300" : "fill-slate-500 dark:fill-slate-400"}`}
            >
              {labels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
