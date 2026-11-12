import { absoluteUrl } from "@/lib/routes";
import { SITEMAP_IDS } from "../sitemaps/sitemap";

export const dynamic = "force-static";

/** Sitemap index pointing at the split sitemaps. */
export function GET() {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    SITEMAP_IDS.map((id) => `  <sitemap><loc>${absoluteUrl(`/sitemaps/sitemap/${id}.xml`)}</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
