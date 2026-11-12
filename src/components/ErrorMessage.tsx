"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useI18n } from "@/i18n/client";

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message,
  onClose,
  onRetry,
}: ErrorMessageProps) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="animate-rise flex items-start gap-3 rounded-2xl border border-rose-300/60 bg-rose-50/90 p-4 backdrop-blur-md dark:border-rose-400/30 dark:bg-rose-950/60"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
        aria-hidden="true"
      />
      <p className="flex-1 text-sm text-rose-800 dark:text-rose-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-600"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {t.common.retry}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t.common.dismiss}
        className="shrink-0 rounded-lg p-1 text-rose-500 transition-colors hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
