import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.weather-now.app"),
  title: {
    default: "WeatherNow - Real-Time Weather Forecasts & Conditions",
    template: "%s | WeatherNow",
  },
  description:
    "Get accurate real-time weather forecasts, current conditions, and hourly predictions for any location worldwide. WeatherNow provides reliable weather data.",
  authors: [{ name: "Robert Libsansky" }],
  creator: "Robert Libsansky",
  publisher: "Robert Libsansky",
  applicationName: "WeatherNow",
  category: "Weather",
  classification: "Weather Application",
  keywords: [
    "weather",
    "forecast",
    "current weather",
    "weather app",
    "temperature",
    "weather conditions",
    "hourly forecast",
    "weekly forecast",
    "weather data",
    "meteorology",
    "climate",
    "precipitation",
    "humidity",
    "wind speed",
  ],
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
    title: "WeatherNow - Real-Time Weather Forecasts & Conditions",
    description:
      "Get accurate real-time weather forecasts, current conditions, and hourly predictions for any location worldwide. WeatherNow provides reliable weather data.",
    images: ["/opengraph-image.png"],
  },
  themeColor: "#0ea5e9",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="font-sans min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
