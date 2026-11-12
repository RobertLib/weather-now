import type { Metadata, Viewport } from "next";
import SiteShell from "@/components/SiteShell";
import { rootMetadata } from "@/lib/seo";

export const metadata: Metadata = rootMetadata("en");

// Regenerates otherwise static pages (about, legal, widget) so the footer's
// copyright year doesn't freeze at build time. Kept at the data pages' hour so
// it stays below `expireTime` in next.config.ts.
export const revalidate = 3600;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0284c7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
