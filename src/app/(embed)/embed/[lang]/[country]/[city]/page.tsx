import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { describe, getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getPlaceBySlug } from "@/lib/places";
import { placePath } from "@/lib/routes";
import { getForecast } from "@/lib/server-data";
import { upcomingDays } from "@/lib/openmeteo";
import { formatWeekday } from "@/lib/datetime";
import WeatherIcon from "@/components/WeatherIcon";
import { Temp } from "@/components/Units";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

type Params = Promise<{ lang: string; country: string; city: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, country, city } = await params;
  if (!isLocale(lang)) return {};
  const hit = getPlaceBySlug(lang, country, city);
  return hit ? { title: `${hit.place[lang]} – WeatherNow` } : {};
}

/** Compact, script-light forecast card meant to live inside an iframe. */
export default async function EmbedPage({ params }: { params: Params }) {
  const { lang, country: countrySlug, city } = await params;
  if (!isLocale(lang)) notFound();
  const hit = getPlaceBySlug(lang, countrySlug, city);
  if (!hit) notFound();
  const { place, country } = hit;
  const t = getDictionary(lang);
  const forecast = await getForecast(place.lat, place.lon);
  const days = forecast ? upcomingDays(forecast).slice(0, 4) : [];
  const href = `https://www.weather-now.app${placePath(lang, country, place)}`;

  return (
    <I18nProvider locale={lang}>
      <div lang={lang} className="h-[260px] overflow-hidden rounded-2xl bg-linear-to-br from-sky-600 to-blue-800 p-4 text-white dark:from-slate-800 dark:to-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold">{place[lang]}</p>
            <p className="truncate text-xs text-white/75">{country[lang]}</p>
          </div>
          <a href={href} target="_blank" rel="noopener" className="shrink-0 text-xs font-semibold text-white/85 underline-offset-2 hover:underline">
            {t.embed.full} →
          </a>
        </div>

        {forecast ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <WeatherIcon code={forecast.current.code} night={!forecast.current.isDay} className="h-16 w-16" title={describe(t, forecast.current.code)} />
              <div>
                <p className="font-display tabular text-4xl leading-none font-bold">
                  <Temp c={forecast.current.temp} />
                </p>
                <p className="text-sm text-white/85">{describe(t, forecast.current.code)}</p>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-4 gap-1.5">
              {days.map((d, i) => (
                <li key={d.date} className="rounded-xl bg-white/12 px-1 py-1.5 text-center">
                  <p className="text-[0.65rem] font-semibold text-white/80 capitalize">
                    {i === 0 ? t.common.today : formatWeekday(d.time, forecast.timezone, lang, "short")}
                  </p>
                  <WeatherIcon code={d.code} className="mx-auto h-7 w-7" animated={false} />
                  <p className="tabular text-xs font-bold">
                    <Temp c={d.tempMax} /> <span className="font-normal text-white/70"><Temp c={d.tempMin} /></span>
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-6 text-sm text-white/85">{t.errors.generic}</p>
        )}

        <p className="mt-2 text-right text-[0.65rem] text-white/70">
          <a href={href} target="_blank" rel="noopener" className="hover:underline">
            {t.embed.by}
          </a>
        </p>
      </div>
    </I18nProvider>
  );
}
