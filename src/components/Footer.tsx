import Link from "next/link";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getCountry, popularPlaces, topCountries } from "@/lib/places";
import { CLIMATE_PROVIDERS } from "@/lib/climate";
import { countryPath, homePath, pagePath, placePath, worldPath } from "@/lib/routes";

/** GitHub mark — lucide-react dropped brand icons in v1, so it lives inline. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

const linkClass = "text-slate-400 transition-colors hover:text-white";

/**
 * Site-wide footer. Besides the usual links it carries the most popular city
 * and country pages, so every page passes crawlers into the forecast pages.
 */
export default function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const popular = popularPlaces(locale);
  const countries = topCountries(locale);

  return (
    <footer className="border-t border-white/10 bg-slate-950/70 text-slate-300 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold text-white">
              Weather
              <span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
                Now
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{t.footer.blurb}</p>
            <a
              href="https://github.com/RobertLib/weather-now"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
            >
              <GithubMark className="h-3.5 w-3.5" />
              {t.footer.source}
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{t.footer.popular}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {popular.map((place) => {
                const country = getCountry(place.cc)!;
                return (
                  <li key={place.id}>
                    <Link href={placePath(locale, country, place)} className={linkClass}>
                      {place[locale]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{t.footer.countries}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {countries.map((country) => (
                <li key={country.cc}>
                  <Link href={countryPath(locale, country)} className={linkClass}>
                    {country[locale]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={worldPath(locale)} className="font-medium text-sky-300 hover:text-white">
                  {t.footer.allCountries} →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">{t.footer.project}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={pagePath(locale, "widget")} className={linkClass}>
                  {t.footer.widget}
                </Link>
              </li>
              <li>
                <Link href={pagePath(locale, "about")} className={linkClass}>
                  {t.footer.about}
                </Link>
              </li>
              <li>
                <Link href={pagePath(locale, "privacy")} className={linkClass}>
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={pagePath(locale, "terms")} className={linkClass}>
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <a href={homePath(locale === "en" ? "cs" : "en")} hrefLang={locale === "en" ? "cs" : "en"} className={linkClass}>
                  {t.nav.switchTo}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-2 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-slate-400">
            {t.footer.data}{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noopener" className="underline hover:text-white">
              Open-Meteo.com
            </a>{" "}
            (
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" className="underline hover:text-white">
              CC BY 4.0
            </a>
            ) · {t.footer.climateData}{" "}
            {CLIMATE_PROVIDERS.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                <a href={p.url} target="_blank" rel="noopener" className="underline hover:text-white">
                  {p.name}
                </a>
              </span>
            ))}
          </p>
          <p className="text-sm text-slate-400">{t.footer.copyright(new Date().getFullYear())}</p>
          <p className="mx-auto max-w-2xl text-xs text-slate-500">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
