import type { MetadataRoute } from "next";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { homePath } from "@/lib/routes";

/**
 * Web app manifest per language: an app installed from the Czech site opens
 * in Czech. Both share the scope, so links between the languages stay in-app,
 * but have their own `id`, so each language is a separate installable app.
 */
export function buildManifest(locale: Locale): MetadataRoute.Manifest {
  const t = getDictionary(locale);
  const home = homePath(locale);
  return {
    id: home,
    name: t.meta.appName,
    short_name: t.meta.siteName,
    description: t.meta.appDescription,
    start_url: home,
    display: "standalone",
    // Matches the app's sky backdrop so the PWA splash screen doesn't flash white.
    background_color: "#0b1220",
    theme_color: "#0284c7",
    scope: "/",
    lang: locale,
    dir: "ltr",
    categories: ["weather", "productivity", "utilities"],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "375x812",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Full-bleed variant with the artwork inside Android's safe circle, so
        // adaptive-icon masks can't crop the mark.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
