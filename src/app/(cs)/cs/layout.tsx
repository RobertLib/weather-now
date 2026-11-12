import type { Metadata, Viewport } from "next";
import SiteShell from "@/components/SiteShell";
import { rootMetadata } from "@/lib/seo";

export const metadata: Metadata = rootMetadata("cs");

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0284c7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function CzechLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="cs">{children}</SiteShell>;
}
