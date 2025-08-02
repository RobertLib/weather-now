import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.weather-now.app",
    title: "WeatherNow - Real-Time Weather Forecasts & Conditions",
    description:
      "Get accurate real-time weather forecasts, current conditions, and hourly predictions for any location worldwide. WeatherNow provides reliable weather data.",
    siteName: "WeatherNow",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "WeatherNow - Real-Time Weather Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://www.weather-now.app",
  },
};

export default function Home() {
  return <HomeClient />;
}
