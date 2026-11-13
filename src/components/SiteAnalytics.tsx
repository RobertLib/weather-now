"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Drops the query string before a page view is recorded. The homepage keeps
 * the chosen place in it (`/?lat=…&lon=…&name=…`), which is personal data the
 * statistics don't need. A client component because `beforeSend` is a function.
 */
function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  return { ...event, url: url.href };
}

export default function SiteAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
