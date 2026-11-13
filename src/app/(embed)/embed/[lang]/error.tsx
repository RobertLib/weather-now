"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

/**
 * Shown inside the iframe when a widget that was never rendered can't be
 * (Open-Meteo down). Cached widgets keep their last good version instead.
 */
export default function EmbedError({ retry }: { error: unknown; retry: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  return (
    <div className="flex h-65 flex-col items-center justify-center gap-3 rounded-2xl bg-linear-to-br from-sky-600 to-blue-800 p-4 text-center text-white dark:from-slate-800 dark:to-slate-950">
      <p className="text-sm text-white/85">{t.errors.generic}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-semibold hover:bg-white/25"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
