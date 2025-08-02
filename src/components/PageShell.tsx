import { ReactNode } from "react";
import { DEFAULT_THEME } from "@/lib/conditions";
import WeatherBackground from "./WeatherBackground";

interface PageShellProps {
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}

/** Shared frame for the static content pages so they match the weather view. */
export default function PageShell({ title, lead, children }: PageShellProps) {
  return (
    <>
      <WeatherBackground theme={DEFAULT_THEME} />
      <div className="mx-auto max-w-4xl px-3 py-8 sm:px-4 sm:py-12">
        <header className="text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
            {title}
          </h1>
          {lead && (
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
              {lead}
            </p>
          )}
        </header>

        <div className="glass animate-rise mt-7 rounded-3xl p-5 text-slate-800 sm:mt-9 sm:p-8 dark:text-slate-100">
          {children}
        </div>
      </div>
    </>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureGrid({
  features,
}: {
  features: Array<{ title: string; text: string; emoji: string }>;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="glass-soft rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
        >
          <p className="text-xl" aria-hidden="true">
            {feature.emoji}
          </p>
          <h3 className="mt-1.5 font-semibold text-slate-800 dark:text-slate-100">
            {feature.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {feature.text}
          </p>
        </div>
      ))}
    </div>
  );
}
