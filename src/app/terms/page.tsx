import { Metadata } from "next";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 pt-4 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
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
                Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using WeatherNow, you accept and agree to be
                bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Use License
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Permission is granted to temporarily access WeatherNow for
                personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Modify or copy the materials</li>
                <li>
                  Use the materials for any commercial purpose or for any public
                  display
                </li>
                <li>
                  Attempt to reverse engineer any software contained on the
                  website
                </li>
                <li>
                  Remove any copyright or other proprietary notations from the
                  materials
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Disclaimer
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Weather information is provided for general informational
                purposes only. WeatherNow makes no warranties about the
                accuracy, reliability, completeness, or timeliness of weather
                data. Users should not rely solely on this information for
                critical decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Limitations
              </h2>
              <p className="text-gray-600 leading-relaxed">
                In no event shall WeatherNow or its suppliers be liable for any
                damages (including, without limitation, damages for loss of data
                or profit, or due to business interruption) arising out of the
                use or inability to use WeatherNow, even if WeatherNow or its
                authorized representative has been notified orally or in writing
                of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Accuracy of Materials
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The materials appearing on WeatherNow could include technical,
                typographical, or photographic errors. WeatherNow does not
                warrant that any of the materials on its website are accurate,
                complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Modifications
              </h2>
              <p className="text-gray-600 leading-relaxed">
                WeatherNow may revise these terms of service for its website at
                any time without notice. By using this web site, you are
                agreeing to be bound by the then current version of these terms
                of service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
