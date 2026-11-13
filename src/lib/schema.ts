import { SITE_URL, absoluteUrl } from "@/lib/routes";

/**
 * schema.org JSON-LD builders. Rendered on the server so crawlers see them in
 * the initial HTML.
 */

const PUBLISHER = {
  "@type": "Person",
  name: "Robert Libsansky",
  url: "https://github.com/RobertLib",
};

export function websiteSchema(name: string, description: string, language: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: SITE_URL,
    description,
    inLanguage: language,
    publisher: PUBLISHER,
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function placePageSchema(opts: {
  title: string;
  description: string;
  path: string;
  language: string;
  place: { name: string; country: string; cc: string; lat: number; lon: number; elevation?: number };
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    inLanguage: opts.language,
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    isPartOf: { "@type": "WebSite", name: "WeatherNow", url: SITE_URL },
    about: {
      "@type": "City",
      name: opts.place.name,
      address: {
        "@type": "PostalAddress",
        addressCountry: opts.place.cc,
      },
      containedInPlace: { "@type": "Country", name: opts.place.country },
      geo: {
        "@type": "GeoCoordinates",
        latitude: opts.place.lat,
        longitude: opts.place.lon,
        ...(opts.place.elevation !== undefined ? { elevation: opts.place.elevation } : {}),
      },
    },
  };
}

export function faqSchema(items: Array<[string, string]>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function climateDatasetSchema(opts: {
  name: string;
  description: string;
  path: string;
  /** Every upstream provider of the numbers (temperatures first). */
  sources: Array<{ name: string; url: string; license: string }>;
  period: string;
  lat: number;
  lon: number;
}) {
  const one = <T,>(list: T[]) => (list.length === 1 ? list[0] : list);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    temporalCoverage: opts.period.replace("–", "/"),
    license: opts.sources.map((s) => `${s.name}: ${s.license}`).join("; "),
    isBasedOn: one(opts.sources.map((s) => s.url)),
    creator: one(opts.sources.map((s) => ({ "@type": "Organization", name: s.name }))),
    spatialCoverage: {
      "@type": "Place",
      geo: { "@type": "GeoCoordinates", latitude: opts.lat, longitude: opts.lon },
    },
    variableMeasured: ["Average high temperature", "Average low temperature", "Precipitation"],
  };
}
