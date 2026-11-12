import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import NotFoundView from "@/views/NotFoundView";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.weather-now.app"),
  title: "404 — WeatherNow",
  robots: { index: false },
};

/** Unmatched URLs outside both language trees. */
export default function GlobalNotFound() {
  return (
    <SiteShell locale="en">
      <NotFoundView locale="en" />
    </SiteShell>
  );
}
