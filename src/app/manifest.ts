import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WeatherNow - Real-Time Weather Forecasts",
    short_name: "WeatherNow",
    description:
      "Get accurate real-time weather forecasts, current conditions, and hourly predictions for any location worldwide.",
    start_url: "/",
    display: "standalone",
    // Matches the app's sky backdrop so the PWA splash screen doesn't flash white.
    background_color: "#0b1220",
    theme_color: "#0284c7",
    orientation: "portrait",
    scope: "/",
    lang: "en",
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
