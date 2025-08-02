"use client";

import {
  Clock,
  Droplets,
  Lightbulb,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import { Insight, InsightTone } from "@/lib/insights";
import Card from "./Card";

const ICONS = {
  shirt: Shirt,
  umbrella: Umbrella,
  sun: Sun,
  wind: Wind,
  snow: Snowflake,
  thermometer: Thermometer,
  sparkles: Sparkles,
  clock: Clock,
  droplets: Droplets,
} as const;

const TONES: Record<InsightTone, string> = {
  good: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  alert: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

interface InsightsCardProps {
  insights: Insight[];
  delay?: number;
}

export default function InsightsCard({ insights, delay = 0 }: InsightsCardProps) {
  if (!insights.length) return null;

  return (
    <Card
      title="What this means"
      subtitle="Plain-language takeaways"
      icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />}
      delay={delay}
    >
      <ul className="space-y-2.5">
        {insights.map((insight) => {
          const Icon = ICONS[insight.icon];
          return (
            <li key={insight.id} className="flex gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[insight.tone]}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
                  {insight.text}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
