import { Metadata } from "next";
import PageShell, { Bullets, FeatureGrid, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about WeatherNow, your trusted source for accurate real-time weather forecasts, current conditions, and detailed weather predictions worldwide.",
  keywords: [
    "about WeatherNow",
    "weather app",
    "weather service",
    "meteorology",
    "weather data",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.weather-now.app/about",
    title: "About | WeatherNow",
    description:
      "Learn about WeatherNow, your trusted source for accurate real-time weather forecasts, current conditions, and detailed weather predictions worldwide.",
    siteName: "WeatherNow",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "About WeatherNow - Real-Time Weather Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://www.weather-now.app/about",
  },
};

export default function About() {
  return (
    <PageShell
      title="About WeatherNow"
      lead="A fast, ad-free weather app built to make forecasts genuinely readable."
    >
      <Section heading="What is WeatherNow?">
        <p>
          WeatherNow turns raw meteorological data into something you can act on
          in a few seconds. Instead of a wall of numbers you get a live sky that
          reflects the current conditions, an interactive temperature trend, and
          plain-language takeaways such as what to wear or whether you will want
          an umbrella this afternoon.
        </p>
        <p>
          It works anywhere in the world, needs no account, and keeps your
          preferences in your own browser.
        </p>
      </Section>

      <Section heading="What you get">
        <FeatureGrid
          features={[
            {
              emoji: "🌡️",
              title: "Live conditions",
              text: "Temperature, feels-like, humidity, wind with a compass, pressure trend, visibility and cloud cover.",
            },
            {
              emoji: "📈",
              title: "Interactive trend",
              text: "A 42-hour temperature and feels-like curve with precipitation chance underneath. Hover any point for exact values.",
            },
            {
              emoji: "📅",
              title: "Day by day",
              text: "Five days of highs and lows on a shared scale, expandable into three-hour detail.",
            },
            {
              emoji: "🍃",
              title: "Air quality",
              text: "The OpenWeather AQI plus the individual pollutants behind it, from PM2.5 to ozone.",
            },
            {
              emoji: "🌞",
              title: "Sun and moon",
              text: "Sunrise, sunset, daylight length, the sun's position through the day and tonight's moon phase.",
            },
            {
              emoji: "⭐",
              title: "Your places",
              text: "Save up to eight cities and switch between them with live temperatures on every chip.",
            },
          ]}
        />
      </Section>

      <Section heading="How to get around">
        <Bullets
          items={[
            <>
              Press <Kbd>/</Kbd> anywhere to jump into the search box, then use
              the arrow keys to pick a suggestion.
            </>,
            "Tap the location button to use your device's GPS position.",
            "Tap the heart on the current city to save it to your places.",
            "Switch between °C/km-h and °F/mph, and between light, dark and system themes, from the header.",
            "Every reading is shown in the local time of the place you are looking at, not your own.",
          ]}
        />
      </Section>

      <Section heading="Where the data comes from">
        <p>
          Current conditions, forecasts, geocoding and air quality all come from
          the OpenWeather API and refresh automatically every ten minutes while
          the page is open. Sun and moon values are calculated from the sunrise
          and sunset times of the location you are viewing.
        </p>
        <p>
          The activity ratings are heuristics meant to be fun and roughly useful.
          They are not meteorological advice: for warnings and severe weather,
          always check your national weather service.
        </p>
      </Section>

      <Section heading="About the developer">
        <p>
          WeatherNow was created by <strong>Robert Libsansky</strong>, a
          developer focused on fast, accessible web applications built with
          Next.js and TypeScript. The source code is on{" "}
          <a
            href="https://github.com/RobertLib/weather-now"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-500 dark:text-sky-300"
          >
            GitHub
          </a>
          .
        </p>
      </Section>
    </PageShell>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-400/40 bg-slate-900/8 px-1.5 py-0.5 font-mono text-[0.7rem] dark:bg-white/10">
      {children}
    </kbd>
  );
}
