import { Metadata } from "next";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 pt-4 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              About WeatherNow
            </h1>
            <p className="text-xl text-gray-600">
              Your trusted companion for accurate weather information
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                What is WeatherNow?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                WeatherNow is a modern, user-friendly weather application that
                provides real-time weather updates, detailed forecasts, and
                comprehensive weather data for locations worldwide. Built with
                cutting-edge technology, our platform delivers accurate and
                up-to-date meteorological information to help you plan your day,
                week, and beyond.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Real-Time Weather Data
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get current weather conditions including temperature,
                    humidity, wind speed, and atmospheric pressure.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Hourly Forecasts
                  </h3>
                  <p className="text-gray-600 text-sm">
                    View detailed hourly weather predictions for the next 48
                    hours.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    7-Day Outlook
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Plan ahead with comprehensive weekly weather forecasts.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Location Search
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Search for weather information in any city worldwide or use
                    your current location.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Data Sources
              </h2>
              <p className="text-gray-600 leading-relaxed">
                WeatherNow uses reliable weather data from trusted
                meteorological services to ensure accuracy and reliability. Our
                data is updated in real-time to provide you with the most
                current weather information available.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                About the Developer
              </h2>
              <p className="text-gray-600 leading-relaxed">
                WeatherNow was created by <strong>Robert Libsansky</strong>, a
                passionate developer focused on creating user-friendly web
                applications. With expertise in modern web technologies like
                Next.js, TypeScript, and responsive design, Robert aims to
                deliver high-quality, accessible applications that solve
                real-world problems.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
