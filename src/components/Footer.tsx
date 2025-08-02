import Link from "next/link";
import { Github } from "lucide-react";

const FEATURES = [
  "Live conditions worldwide",
  "42-hour interactive trend",
  "Five-day day-by-day outlook",
  "Air quality & pollutants",
  "Sun, moon phase & daylight",
  "Saved places & unit switching",
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70 text-slate-300 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <p className="font-display text-lg font-bold text-white">
              Weather
              <span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
                Now
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A fast, ad-free weather app: live conditions, readable trends and
              honest forecasts for anywhere on Earth.
            </p>
            <a
              href="https://github.com/RobertLib/weather-now"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              Source on GitHub
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              What&apos;s inside
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Project</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {COMPANY.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Good to know</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Weather data by OpenWeather</li>
              <li>Refreshes every 10 minutes</li>
              <li>Preferences stay in your browser</li>
              <li>No account required</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} WeatherNow by Robert Libsansky. All
            rights reserved.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-500">
            Forecasts and the activity ratings shown here are informational.
            Always check official meteorological services for warnings and
            severe-weather alerts.
          </p>
        </div>
      </div>
    </footer>
  );
}
