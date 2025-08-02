import { Metadata } from "next";
import PageShell, { Bullets, Section } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "WeatherNow terms of service. Read our terms and conditions for using our weather application and services.",
  keywords: [
    "terms of service",
    "terms and conditions",
    "WeatherNow terms",
    "user agreement",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.weather-now.app/terms",
    title: "Terms of Service | WeatherNow",
    description:
      "WeatherNow terms of service. Read our terms and conditions for using our weather application and services.",
    siteName: "WeatherNow",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "WeatherNow Terms of Service - Real-Time Weather Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://www.weather-now.app/terms",
  },
};

export default function Terms() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell title="Terms of Service" lead={`Last updated: ${updated}`}>
      <Section heading="Acceptance of terms">
        <p>
          By accessing and using WeatherNow you agree to these terms. If you do
          not agree with them, please do not use the service.
        </p>
      </Section>

      <Section heading="Use of the service">
        <p>
          WeatherNow is provided free of charge for personal, non-commercial use.
          You are welcome to use it as much as you like, and the source code is
          published under the MIT licence. You agree not to:
        </p>
        <Bullets
          items={[
            "Attempt to disrupt, overload or automate abusive traffic against the service or the upstream weather API",
            "Redistribute the underlying weather data in breach of OpenWeather's own terms",
            "Remove or obscure copyright or attribution notices",
          ]}
        />
      </Section>

      <Section heading="Forecast accuracy">
        <p>
          Weather information is provided for general informational purposes
          only. Forecasts are inherently uncertain, and the activity ratings and
          plain-language tips in the app are heuristics rather than
          meteorological advice.
        </p>
        <p>
          <strong>Never rely on WeatherNow for safety-critical decisions.</strong>{" "}
          For storm warnings, flood alerts, aviation, marine or mountain
          planning, always consult your official national weather service.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          The service depends on third-party APIs and may be unavailable, delayed
          or rate-limited at any time. It is offered &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, WeatherNow and its author are
          not liable for any damages arising from the use of, or inability to
          use, this service — including loss of data, loss of profit or decisions
          made on the basis of the information shown.
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          These terms may be revised at any time without notice. Continuing to
          use the site means you accept the current version.
        </p>
      </Section>
    </PageShell>
  );
}
