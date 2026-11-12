"use client";

import ErrorView from "@/views/ErrorView";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView locale="en" error={error} retry={retry} />;
}
