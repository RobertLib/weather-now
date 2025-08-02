import { Metadata } from "next";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 pt-4 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                WeatherNow is committed to protecting your privacy. We collect
                minimal information necessary to provide you with weather
                services:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Location data (only when you grant permission for
                  location-based weather)
                </li>
                <li>Search queries for weather locations</li>
                <li>
                  Technical information such as browser type and device
                  information
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The information we collect is used solely to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                <li>
                  Provide accurate weather information for your requested
                  locations
                </li>
                <li>Improve our service quality and user experience</li>
                <li>
                  Ensure the security and functionality of our application
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Data Sharing
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We do not sell, trade, or share your personal information with
                third parties except as necessary to provide our weather
                services or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate security measures to protect your
                information against unauthorized access, alteration, disclosure,
                or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please
                contact us through our support channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
