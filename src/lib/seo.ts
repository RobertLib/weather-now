import type { Metadata } from "next";
import { Locale, OG_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { SITE_URL, absoluteUrl } from "@/lib/routes";

export type Alternates = Partial<Record<Locale, string>>;

interface PageMetaInput {
  locale: Locale;
  title: string;
  description: string;
  /** Path of this page in this locale. */
  path: string;
  /** The same page in every available language (paths). */
  alternates: Alternates;
  /** Skip the "| WeatherNow" suffix (city pages carry their own context). */
  absoluteTitle?: boolean;
  noindex?: boolean;
}

/** Canonical, hreflang, Open Graph and Twitter tags for one page. */
export function pageMetadata({
  locale,
  title,
  description,
  path,
  alternates,
  absoluteTitle = false,
  noindex = false,
}: PageMetaInput): Metadata {
  const t = getDictionary(locale);
  const languages: Record<string, string> = {};
  for (const [lang, href] of Object.entries(alternates)) {
    if (href) languages[lang] = absoluteUrl(href);
  }
  if (alternates.en) languages["x-default"] = absoluteUrl(alternates.en);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages,
    },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      locale: OG_LOCALE[locale],
      url: absoluteUrl(path),
      title,
      description,
      // A static file (public/), not the app/ file convention, which would also
      // attach it to the global error page, where no metadataBase can be set.
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image.png"],
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

/** Defaults shared by every page of one language tree. */
export function rootMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.home.title, template: `%s | ${t.meta.siteName}` },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    authors: [{ name: "Robert Libsansky", url: "https://github.com/RobertLib" }],
    creator: "Robert Libsansky",
    category: "weather",
    formatDetection: { telephone: false, address: false },
  };
}
