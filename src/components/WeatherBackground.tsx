"use client";

import { SkyTheme, skyGradient } from "@/lib/conditions";

/**
 * Deterministic pseudo-random in [0,1) so the server and client render the
 * exact same particle layout (Math.random would trip hydration).
 */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  // Math.sin may differ in the last bits between JS engines (server V8 vs the
  // visitor's browser); rounding keeps the printed style values identical.
  return Math.round((x - Math.floor(x)) * 1e4) / 1e4;
}

interface WeatherBackgroundProps {
  theme: SkyTheme;
}

export default function WeatherBackground({ theme }: WeatherBackgroundProps) {
  const { kind, night } = theme;
  const raining = kind === "rain" || kind === "drizzle" || kind === "thunder";
  const snowing = kind === "snow";
  const cloudy =
    kind === "clouds" ||
    kind === "partly" ||
    kind === "fog" ||
    raining ||
    snowing;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base sky */}
      <div
        key={`${kind}-${night}`}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: skyGradient(theme) }}
      />

      {/* Sun / moon glow */}
      {night ? (
        <div className="absolute right-[12%] top-[8%] h-40 w-40 rounded-full bg-slate-100/80 blur-[2px] opacity-90 mix-blend-screen">
          <div className="absolute inset-0 rounded-full bg-slate-200/90 shadow-[0_0_120px_50px_rgba(226,232,240,0.28)]" />
          <div className="absolute inset-[18%] rounded-full bg-slate-400/25 blur-md" />
        </div>
      ) : (
        <div className="animate-pulse-glow absolute right-[10%] top-[4%] h-56 w-56 rounded-full bg-amber-200/70 blur-3xl" />
      )}

      {/* Stars on clear/partly nights */}
      {night && (kind === "clear" || kind === "partly") && (
        <div className="absolute inset-0">
          {Array.from({ length: 70 }, (_, i) => {
            const size = 1 + rand(i + 7) * 2;
            return (
              <span
                key={i}
                className="animate-twinkle absolute rounded-full bg-white"
                style={{
                  left: `${rand(i + 1) * 100}%`,
                  top: `${rand(i + 31) * 62}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${rand(i + 61) * 4}s`,
                  animationDuration: `${3 + rand(i + 91) * 4}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Drifting cloud banks */}
      {cloudy && (
        <div className="absolute inset-x-0 top-0 h-[70%]">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`absolute rounded-[50%] blur-2xl ${
                i % 2 === 0
                  ? "animate-drift-slow"
                  : i % 3 === 0
                  ? "animate-drift-fast"
                  : "animate-drift"
              }`}
              style={{
                left: `${-10 + rand(i + 3) * 80}%`,
                top: `${2 + rand(i + 17) * 45}%`,
                width: `${22 + rand(i + 23) * 30}rem`,
                height: `${7 + rand(i + 29) * 7}rem`,
                background: night
                  ? "rgba(148,163,184,0.22)"
                  : "rgba(255,255,255,0.42)",
                animationDelay: `${i * -12}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Fog bands */}
      {kind === "fog" && (
        <div className="absolute inset-x-0 bottom-0 h-2/3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="animate-drift absolute h-16 w-[160%] blur-xl"
              style={{
                left: "-30%",
                bottom: `${i * 12}%`,
                background: night
                  ? "rgba(203,213,225,0.10)"
                  : "rgba(255,255,255,0.32)",
                animationDelay: `${i * -8}s`,
                animationDuration: `${40 + i * 6}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Rain, snow and lightning only make sense in motion. With reduced motion
          their animations end at once and the layers would fall back to their
          resting styles: drops frozen along the top edge and a permanent flash. */}
      {raining && (
        <div className="absolute inset-0 motion-reduce:hidden">
          {Array.from({ length: kind === "drizzle" ? 45 : 80 }, (_, i) => (
            <span
              key={i}
              className="animate-rain absolute top-0 w-px rounded-full"
              style={{
                left: `${rand(i + 5) * 100}%`,
                height: `${(kind === "drizzle" ? 8 : 14) + rand(i + 13) * 12}px`,
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0), rgba(219,234,254,0.85))",
                animationDelay: `${rand(i + 37) * 1.4}s`,
                animationDuration: `${
                  (kind === "drizzle" ? 1.2 : 0.75) + rand(i + 53) * 0.5
                }s`,
              }}
            />
          ))}
        </div>
      )}

      {snowing && (
        <div className="absolute inset-0 motion-reduce:hidden">
          {Array.from({ length: 60 }, (_, i) => {
            const size = 3 + rand(i + 11) * 5;
            return (
              <span
                key={i}
                className="animate-snow absolute top-0 rounded-full bg-white/85"
                style={{
                  left: `${rand(i + 2) * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  filter: "blur(0.4px)",
                  animationDelay: `${rand(i + 43) * 9}s`,
                  animationDuration: `${7 + rand(i + 71) * 9}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {kind === "thunder" && (
        <div className="animate-flash absolute inset-0 bg-indigo-100/60 motion-reduce:hidden" />
      )}

      {/* Horizon haze + vignette to keep text legible */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-white/25 to-transparent dark:from-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,rgba(2,6,23,0.28)_100%)]" />
    </div>
  );
}
