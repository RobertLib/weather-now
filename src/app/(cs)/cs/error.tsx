"use client";

import ErrorView from "@/views/ErrorView";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView locale="cs" error={error} retry={retry} />;
}
