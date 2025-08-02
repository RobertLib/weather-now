import { Metadata } from "next";
import PageShell, { Bullets, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "WeatherNow privacy policy. Learn how we protect your privacy and handle your data when using our weather application.",
  keywords: [
    "privacy policy",
    "data protection",
    "WeatherNow privacy",
    "user data",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.weather-now.app/privacy",
    title: "Privacy Policy | WeatherNow",
    description:
      "WeatherNow privacy policy. Learn how we protect your privacy and handle your data when using our weather application.",
    siteName: "WeatherNow",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "WeatherNow Privacy Policy - Real-Time Weather Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://www.weather-now.app/privacy",
  },
};

export default function Privacy() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell title="Privacy Policy" lead={`Last updated: ${updated}`}>
      <Section heading="The short version">
        <p>
          WeatherNow has no accounts, no profiles and no advertising trackers.
          Your saved cities, unit choice and theme live in your own
          browser&apos;s local storage and are never sent to us.
        </p>
      </Section>

      <Section heading="Information we process">
        <Bullets
          items={[
            "The city names or coordinates you search for, which are sent to the OpenWeather API to fetch a forecast.",
            "Your approximate location, only if you explicitly grant permission by using the location button. It is used for that single lookup and is not stored on a server.",
            "Aggregated, anonymous usage statistics (page views and performance) collected by Vercel Analytics without cookies.",
          ]}
        />
      </Section>

      <Section heading="Stored in your browser">
        <p>
          These preferences are kept in local storage on your device so the app
          remembers them on your next visit. Clearing your browser data removes
          them permanently.
        </p>
        <Bullets
          items={[
            "Your saved places",
            "Your unit system (metric or imperial)",
            "Your theme preference (light, dark or system)",
            "The last place you looked at",
          ]}
        />
      </Section>

      <Section heading="Third-party services">
        <Bullets
          items={[
            <>
              <strong>OpenWeather</strong> receives the location you request in
              order to return weather, geocoding and air quality data.
            </>,
            <>
              <strong>Vercel</strong> hosts the site and provides
              privacy-friendly, cookie-free analytics.
            </>,
          ]}
        />
      </Section>

      <Section heading="Data sharing and security">
        <p>
          We do not sell, trade or share personal information. Traffic is served
          over HTTPS, and because there is no user database there is no account
          data to leak.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can deny or revoke location permission at any time in your browser
          settings and keep using the search box instead. Clearing site data
          resets every preference the app has stored.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy can be raised as an issue on the{" "}
          <a
            href="https://github.com/RobertLib/weather-now"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-500 dark:text-sky-300"
          >
            project repository
          </a>
          .
        </p>
      </Section>
    </PageShell>
  );
}
