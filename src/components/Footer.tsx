import Link from "next/link";

/** GitHub mark — lucide-react dropped brand icons in v1, so it lives inline. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

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
              <GithubMark className="h-3.5 w-3.5" />
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
