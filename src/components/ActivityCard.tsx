"use client";

import { Activity } from "lucide-react";
import { ActivityScore } from "@/lib/insights";
import { useI18n } from "@/i18n/client";
import Card from "./Card";

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

interface ActivityCardProps {
  scores: ActivityScore[];
  delay?: number;
}

/** Playful "how good is today for…" ratings — the reason to come back daily. */
export default function ActivityCard({ scores, delay = 0 }: ActivityCardProps) {
  const { t } = useI18n();
  const best = scores.reduce((a, b) => (b.score > a.score ? b : a));

  return (
    <Card
      title={t.activities.title}
      subtitle={t.activities.winner(t.activities.labels[best.id], best.emoji)}
      icon={<Activity className="h-4 w-4" aria-hidden="true" />}
      delay={delay}
    >
      <ul className="space-y-2.5">
        {scores.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="w-20 shrink-0 text-xs font-medium sm:w-24 sm:text-sm">
              {t.activities.labels[item.id]}
            </span>
            <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: scoreColor(item.score),
                }}
              />
            </span>
            <span
              className="w-16 shrink-0 text-right text-[0.68rem] font-semibold sm:w-20 sm:text-xs"
              style={{ color: scoreColor(item.score) }}
            >
              {t.activities.verdicts[item.level]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.68rem] text-slate-500 dark:text-slate-400">
        {t.activities.note}
      </p>
    </Card>
  );
}
