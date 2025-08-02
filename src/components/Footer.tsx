import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">WeatherNow</h3>
              <p className="text-gray-300 text-sm leading-5.5">
                Your trusted source for accurate real-time weather forecasts and
                current conditions worldwide.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Real-time weather data</li>
                <li>Hourly forecasts</li>
                <li>7-day predictions</li>
                <li>Location search</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Weather Topics</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Weather forecasting</li>
                <li>Climate patterns</li>
                <li>Meteorology basics</li>
                <li>Weather safety tips</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} WeatherNow by Robert Libsansky. All
              rights reserved.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Weather data provided by reliable meteorological services. Always
              check official sources for weather warnings and alerts.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
