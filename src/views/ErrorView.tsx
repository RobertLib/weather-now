"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { homePath } from "@/lib/routes";
import PageShell from "@/components/PageShell";

/** Fallback for unexpected rendering errors inside one language tree. */
export default function ErrorView({
  locale,
  error,
  retry,
}: {
  locale: Locale;
  error: unknown;
  retry: () => void;
}) {
  const t = getDictionary(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell title={t.errors.errorTitle} lead={t.errors.errorText}>
      <p className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {t.common.retry}
        </button>
        <Link
          href={homePath(locale)}
          className="inline-flex rounded-2xl border border-slate-900/10 px-5 py-2.5 text-sm font-semibold dark:border-white/15"
        >
          {t.errors.backHome}
        </Link>
      </p>
    </PageShell>
  );
}
