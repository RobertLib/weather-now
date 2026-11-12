import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Locale } from "@/i18n/config";
import { Dictionary, describe, getDictionary } from "@/i18n";
import type { DayBrief, OverviewProse } from "@/i18n/en";
import { Country, Place, getPlaceBySlug } from "@/lib/places";
import { CityView, parseCityView, placePath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { climateDatasetSchema, placePageSchema } from "@/lib/schema";
import { getAirQuality, getForecast, renderTime } from "@/lib/server-data";
import { slimForecast, upcomingDays, upcomingHours } from "@/lib/openmeteo";
import { overviewFacts } from "@/lib/facts";
import { DEFAULT_THEME, conditionKind, skyTheme } from "@/lib/conditions";
import {
  CLIMATE_PERIOD,
  MonthNormals,
  climateProvider,
  climateFacts,
  getClimate,
  monthComfort,
  verdict,
  wearTier,
} from "@/lib/climate";
import { AQI_COLORS, POLLEN_COLORS, aqiLevel, pollenLevel, pollutantReadings } from "@/lib/air";
import { midMonthDaylight, moonPhase, nextMoonEvents, localNoonUtc, sunTimes } from "@/lib/astro";
import { compassIndex } from "@/lib/units";
import { UV_COLORS, uvLevel } from "@/lib/meteo";
import {
  dayKey,
  formatDayMonth,
  formatDuration,
  formatHour,
  formatLongDayMonth,
  formatTime,
  formatWeekday,
  monthShort,
} from "@/lib/datetime";
import { DailyPoint, Forecast, PollenType } from "@/types/weather";
import WeatherDashboard from "@/components/WeatherDashboard";
import AirQualityCard from "@/components/AirQualityCard";
import WeatherIcon from "@/components/WeatherIcon";
import HourlyChart from "@/components/HourlyChart";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { Speed, Temp } from "@/components/Units";
import ClimateChart from "./ClimateChart";
import {
  CityFrame,
  Section,
  StatGrid,
  cityCrumbs,
  tableClass,
  tableWrap,
  tdClass,
  thClass,
} from "./parts";

export interface CityParams {
  country: string;
  city: string;
  view?: string[];
}

interface Resolved {
  place: Place;
  country: Country;
  view: CityView;
  month?: number;
  climate: MonthNormals[] | null;
}

function resolve(locale: Locale, params: CityParams): Resolved | null {
  const hit = getPlaceBySlug(locale, params.country, params.city);
  if (!hit) return null;
  const parsed = parseCityView(locale, params.view);
  if (!parsed) return null;
  const climate = getClimate(hit.place.id);
  if (parsed.view === "climate" && !climate) return null;
  return { ...hit, ...parsed, climate };
}

const NEEDS_FORECAST: CityView[] = ["overview", "tomorrow", "hourly", "14-day"];

/* ------------------------------------------------------------- helpers */

function dayLabel(time: number, tz: string, locale: Locale): string {
  const weekday = formatWeekday(time, tz, locale);
  const date = formatDayMonth(time, tz, locale);
  return locale === "en" ? `${weekday}, ${date}` : `${weekday} ${date}`;
}

function brief(t: Dictionary, locale: Locale, tz: string, d: DailyPoint): DayBrief {
  return {
    cond: describe(t, d.code),
    hi: d.tempMax,
    lo: d.tempMin,
    pop: d.pop,
    precip: d.precipitation,
    windMax: d.windMax,
    uvMax: d.uvMax,
    label: dayLabel(d.time, tz, locale),
  };
}

function overviewProse(t: Dictionary, locale: Locale, name: string, forecast: Forecast): OverviewProse {
  const tz = forecast.timezone;
  const facts = overviewFacts(forecast);
  return {
    name,
    temp: facts.now.temp,
    feels: facts.now.feelsLike,
    cond: describe(t, facts.now.code),
    time: formatTime(facts.now.time, tz, locale),
    today: facts.today ? brief(t, locale, tz, facts.today) : null,
    tomorrow: facts.tomorrow ? brief(t, locale, tz, facts.tomorrow) : null,
    rainPop: facts.rainNext24.maxPop,
    rainAt: facts.rainNext24.peakTime ? formatHour(facts.rainNext24.peakTime, tz, locale) : null,
    week: facts.week
      ? {
          hiMin: facts.week.hiMin,
          hiMax: facts.week.hiMax,
          wetDays: facts.week.wetDays,
          days: facts.week.days,
          warmestLabel:
            facts.week.warmest.date === facts.today?.date
              ? t.common.today.toLowerCase()
              : facts.week.warmest.date === facts.tomorrow?.date
                ? t.common.tomorrow.toLowerCase()
                : dayLabel(facts.week.warmest.time, tz, locale),
          warmestHi: facts.week.warmest.tempMax,
        }
      : null,
    sunrise: facts.today ? formatTime(facts.today.sunrise, tz, locale) : null,
    sunset: facts.today ? formatTime(facts.today.sunset, tz, locale) : null,
  };
}

function themeOf(forecast: Forecast | null) {
  return forecast
    ? skyTheme(conditionKind(forecast.current.code), !forecast.current.isDay)
    : DEFAULT_THEME;
}

function climateProseInput(name: string, months: MonthNormals[]) {
  const f = climateFacts(months);
  return {
    name,
    warmest: f.warmest,
    warmestHi: months[f.warmest].hi,
    coldest: f.coldest,
    coldestLo: months[f.coldest].lo,
    wettest: f.wettest,
    wettestP: months[f.wettest].p,
    driest: f.driest,
    driestP: months[f.driest].p,
    sunniest: f.sunniest,
    best: f.best,
    annualPrecip: f.annualPrecip,
    annualMean: f.annualMean,
    frostMonths: f.frostMonths.length,
  };
}

function monthProseInput(name: string, months: MonthNormals[], m: number, place: Place) {
  const n = months[m];
  const prev = (m + 11) % 12;
  const rank = [...months].map((x, i) => ({ i, hi: x.hi })).sort((a, b) => b.hi - a.hi).findIndex((x) => x.i === m) + 1;
  return {
    name,
    month: m,
    hi: n.hi,
    lo: n.lo,
    p: n.p,
    pd: n.pd,
    sun: n.sun,
    sd: n.sd,
    rhi: n.rhi,
    rlo: n.rlo,
    daylight: formatDuration(midMonthDaylight(m, place.lat, place.lon)),
    prevHi: months[prev].hi,
    prevMonth: prev,
    verdict: verdict(monthComfort(n)),
    annualRank: rank,
  };
}

/* ------------------------------------------------------------ metadata */

export async function cityMetadata(locale: Locale, params: CityParams): Promise<Metadata> {
  const r = resolve(locale, params);
  if (!r) return {};
  const t = getDictionary(locale);
  const name = r.place[locale];
  const cname = r.country[locale];
  let title: string;
  let description: string;

  switch (r.view) {
    case "overview": {
      title = t.city.meta.overview(name, cname);
      const forecast = await getForecast(r.place.lat, r.place.lon);
      description = forecast
        ? t.city.desc.overview(
            name,
            `${Math.round(forecast.current.temp)} °C, ${describe(t, forecast.current.code).toLowerCase()}`
          )
        : t.city.desc.overviewNoData(name);
      break;
    }
    case "climate":
      if (r.month !== undefined) {
        const m = r.climate![r.month];
        title = t.city.meta.month(name, cname, r.month);
        description = t.city.desc.month(name, r.month, m.hi, m.lo, m.p);
      } else {
        title = t.city.meta.climate(name, cname);
        description = t.city.desc.climate(name, climateProseInput(name, r.climate!));
      }
      break;
    default:
      title = t.city.meta[r.view](name, cname);
      description = t.city.desc[r.view](name);
  }

  return pageMetadata({
    locale,
    title,
    description,
    path: placePath(locale, r.country, r.place, r.view, r.month),
    alternates: {
      en: placePath("en", r.country, r.place, r.view, r.month),
      cs: placePath("cs", r.country, r.place, r.view, r.month),
    },
    absoluteTitle: true,
  });
}

/* ---------------------------------------------------------------- page */

export async function CityPage({ locale, params }: { locale: Locale; params: CityParams }) {
  const r = resolve(locale, params);
  if (!r) notFound();
  const { place, country, view, month, climate } = r;
  const t = getDictionary(locale);
  const name = place[locale];

  const forecast = NEEDS_FORECAST.includes(view) ? await getForecast(place.lat, place.lon) : null;
  const air =
    view === "overview" || view === "air-quality" ? await getAirQuality(place.lat, place.lon) : null;

  const extraCrumbs =
    view === "overview"
      ? []
      : [
          { name: t.city.tabs[view], path: placePath(locale, country, place, view) },
          ...(month !== undefined
            ? [{ name: t.months[month], path: placePath(locale, country, place, view, month) }]
            : []),
        ];
  const crumbs = cityCrumbs(locale, country, place, extraCrumbs);

  const pageSchema = placePageSchema({
    title: month !== undefined ? t.city.h1.month(name, month) : t.city.h1[view](name),
    description: t.meta.description,
    path: placePath(locale, country, place, view, month),
    language: locale,
    place: {
      name,
      country: country[locale],
      cc: place.cc,
      lat: place.lat,
      lon: place.lon,
      elevation: place.ele,
    },
    dateModified: forecast ? new Date(forecast.fetchedAt).toISOString() : undefined,
  });

  const frame = {
    locale,
    place,
    country,
    view,
    month,
    crumbs,
    hasClimate: climate !== null,
  };

  const placeRef = {
    name,
    cc: place.cc,
    countryName: country[locale],
    lat: place.lat,
    lon: place.lon,
    path: placePath(locale, country, place),
  };

  /* ---- overview ---- */
  if (view === "overview") {
    const prose = forecast ? overviewProse(t, locale, name, forecast) : null;
    return (
      <CityFrame
        {...frame}
        h1={t.city.h1.overview(name)}
        lead={prose ? t.prose.overview(prose) : t.city.dataUnavailable}
      >
        <JsonLd data={pageSchema} />
        <WeatherDashboard place={placeRef} initialForecast={forecast && slimForecast(forecast)} initialAir={air} />
        {climate && <ClimateTeaser locale={locale} place={place} country={country} months={climate} />}
        {prose && <Faq title={t.city.faqTitle} items={t.faq.overview(prose)} />}
      </CityFrame>
    );
  }

  /* ---- tomorrow ---- */
  if (view === "tomorrow") {
    const tz = forecast?.timezone ?? place.tz;
    const days = forecast ? upcomingDays(forecast) : [];
    const day = days[1];
    const hours = forecast && day ? forecast.hourly.filter((h) => dayKey(h.time, tz) === day.date) : [];
    return (
      <CityFrame
        {...frame}
        h1={t.city.h1.tomorrow(name)}
        lead={
          day
            ? t.prose.tomorrow(name, brief(t, locale, tz, day), formatTime(day.sunrise, tz, locale), formatTime(day.sunset, tz, locale))
            : t.city.dataUnavailable
        }
        theme={themeOf(forecast)}
      >
        <JsonLd data={pageSchema} />
        {day && (
          <>
            <Section title={t.views.tomorrowStats} aside={<DayChip t={t} day={day} />}>
              <StatGrid
                items={[
                  { label: t.common.high, value: <Temp c={day.tempMax} /> },
                  { label: t.common.low, value: <Temp c={day.tempMin} /> },
                  { label: t.common.rainChance, value: day.pop === null ? "—" : `${Math.round(day.pop * 100)} %` },
                  { label: t.common.precipitation, value: `${day.precipitation.toFixed(1)} mm` },
                  { label: t.common.wind, value: <Speed ms={day.windMax} /> },
                  { label: t.common.gusts, value: day.gustMax === null ? "—" : <Speed ms={day.gustMax} /> },
                  { label: t.daily.uvMax, value: day.uvMax === null ? "—" : Math.round(day.uvMax) },
                  { label: t.common.daylight, value: formatDuration(day.daylight / 60) },
                  { label: t.common.sunrise, value: formatTime(day.sunrise, tz, locale) },
                  { label: t.common.sunset, value: formatTime(day.sunset, tz, locale) },
                ]}
              />
            </Section>
            {hours.length > 1 && (
              <Section title={t.chart.title}>
                <HourlyChart items={hours} tz={tz} theme={themeOf(forecast)} step={2} />
              </Section>
            )}
            <Section title={t.views.hourByHour}>
              <HourTable t={t} locale={locale} tz={tz} hours={hours} />
            </Section>
          </>
        )}
      </CityFrame>
    );
  }

  /* ---- hourly ---- */
  if (view === "hourly") {
    const tz = forecast?.timezone ?? place.tz;
    const hours = forecast ? upcomingHours(forecast, 48) : [];
    const temps = hours.map((h) => h.temp);
    return (
      <CityFrame
        {...frame}
        h1={t.city.h1.hourly(name)}
        lead={
          hours.length
            ? t.prose.hourly(name, hours.length, Math.min(...temps), Math.max(...temps), hours.filter((h) => h.pop >= 0.4).length)
            : t.city.dataUnavailable
        }
        theme={themeOf(forecast)}
      >
        <JsonLd data={pageSchema} />
        {hours.length > 1 && (
          <Section title={t.chart.title}>
            <HourlyChart items={hours} tz={tz} theme={themeOf(forecast)} step={3} />
          </Section>
        )}
        {hours.length > 0 && (
          <Section title={t.views.next48} aside={<span className="text-xs text-slate-500 dark:text-slate-400"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-sky-400/40 align-middle" />{t.tables.wetHint}</span>}>
            <HourTable t={t} locale={locale} tz={tz} hours={hours} dayHeaders />
          </Section>
        )}
      </CityFrame>
    );
  }

  /* ---- 14-day ---- */
  if (view === "14-day") {
    const tz = forecast?.timezone ?? place.tz;
    const days = forecast ? upcomingDays(forecast).slice(0, 14) : [];
    const facts = days.length >= 3 ? overviewFacts(forecast!).week : null;
    let lead = t.city.dataUnavailable;
    if (days.length >= 3) {
      const by = (pick: (d: DailyPoint) => number, dir: 1 | -1) =>
        days.reduce((best, d) => (pick(d) * dir > pick(best) * dir ? d : best));
      const warmest = by((d) => d.tempMax, 1);
      const coldest = by((d) => d.tempMin, -1);
      const wettest = by((d) => d.precipitation, 1);
      const avg = (list: DailyPoint[]) => list.reduce((s, d) => s + d.tempMax, 0) / list.length;
      lead = t.prose.range({
        name,
        days: days.length,
        hiMin: Math.min(...days.map((d) => d.tempMax)),
        hiMax: Math.max(...days.map((d) => d.tempMax)),
        warmestLabel: dayLabel(warmest.time, tz, locale),
        warmestHi: warmest.tempMax,
        coldestLabel: dayLabel(coldest.time, tz, locale),
        coldestLo: coldest.tempMin,
        wettestLabel: dayLabel(wettest.time, tz, locale),
        wettestPrecip: wettest.precipitation,
        wetDays: days.filter((d) => d.precipitation >= 1).length,
        trend: avg(days.slice(-3)) - avg(days.slice(0, 3)),
      });
    }
    return (
      <CityFrame {...frame} h1={t.city.h1["14-day"](name)} lead={lead} theme={themeOf(forecast)}>
        <JsonLd data={pageSchema} />
        {days.length > 0 && (
          <Section title={t.views.dailyTable}>
            <DayTable t={t} locale={locale} tz={tz} days={days} />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t.prose.rangeNote}</p>
          </Section>
        )}
        {facts && forecast && (
          <Faq title={t.city.faqTitle} items={t.faq.overview(overviewProse(t, locale, name, forecast)).slice(2)} />
        )}
      </CityFrame>
    );
  }

  /* ---- air quality ---- */
  if (view === "air-quality") {
    const level = air?.europeanAqi != null ? aqiLevel(air.europeanAqi) : null;
    const worst = air?.days.reduce<(typeof air.days)[number] | null>(
      (best, d) => (d.europeanAqi !== null && (!best || d.europeanAqi > (best.europeanAqi ?? -1)) ? d : best),
      null
    );
    const worstLevel = worst?.europeanAqi != null ? aqiLevel(worst.europeanAqi) : null;
    const pollen = air
      ? (Object.entries(air.pollen) as Array<[PollenType, number]>).map(([type, value]) => ({
          type,
          value,
          level: pollenLevel(type, value),
        }))
      : [];

    return (
      <CityFrame
        {...frame}
        h1={t.city.h1["air-quality"](name)}
        lead={
          air && level !== null
            ? t.prose.air(name, air.europeanAqi!, t.air.levels[level], t.air.advice[level], air.usAqi)
            : t.air.unavailable
        }
      >
        <JsonLd data={pageSchema} />
        {air && level !== null && (
          <>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <AirQualityCard air={air} />
              <Section title={t.views.aqiForecast}>
                <ul className="space-y-2">
                  {air.days.map((d) => {
                    const l = d.europeanAqi === null ? null : aqiLevel(d.europeanAqi);
                    return (
                      <li key={d.date} className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2">
                        <span className="text-sm font-semibold capitalize">{dayLabel(d.time, air.timezone, locale)}</span>
                        {l !== null && (
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: AQI_COLORS[l] }}>
                            {t.air.levels[l]} · {Math.round(d.europeanAqi!)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Section>
            </div>

            <Section title={t.views.pollutants}>
              <div className={tableWrap}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>{t.tables.pollutant}</th>
                      <th className={thClass}>{t.tables.value}</th>
                      <th className={thClass}>{t.tables.level}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollutantReadings(air.pollutants).map((p) => (
                      <tr key={p.key}>
                        <td className={tdClass}>{p.label}</td>
                        <td className={tdClass}>{p.value < 10 ? p.value.toFixed(1) : Math.round(p.value)} µg/m³</td>
                        <td className={tdClass}>
                          <span className="block h-1.5 w-32 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(4, p.ratio * 100)}%`, backgroundColor: AQI_COLORS[level] }} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {pollen.length > 0 && (
              <Section title={t.air.pollen} aside={<span className="text-xs text-slate-500 dark:text-slate-400">{t.views.pollenNote}</span>}>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {pollen.map((p) => (
                    <li key={p.type} className="glass-soft flex items-center justify-between rounded-xl px-3 py-2 text-sm">
                      <span className="font-medium">{t.air.pollenTypes[p.type]}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: POLLEN_COLORS[p.level] }}>
                        {t.air.pollenLevels[p.level]}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title={t.views.aqiScale}>
              <ul className="space-y-1.5 text-sm">
                {t.air.levels.map((label, i) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold text-white" style={{ backgroundColor: AQI_COLORS[i] }}>
                      {["0–20", "20–40", "40–60", "60–80", "80–100", "100+"][i]}
                    </span>
                    <span>
                      <strong>{label}.</strong> {t.air.advice[i]}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Faq
              title={t.city.faqTitle}
              items={t.faq.air(
                name,
                t.air.levels[level],
                air.europeanAqi!,
                worst && worstLevel !== null && worstLevel > level ? dayLabel(worst.time, air.timezone, locale) : null,
                worst && worstLevel !== null && worstLevel > level ? t.air.levels[worstLevel] : null
              )}
            />
          </>
        )}
      </CityFrame>
    );
  }

  /* ---- sunrise & sunset ---- */
  if (view === "sunrise-sunset") {
    return (
      <CityFrame {...frame} h1={t.city.h1["sunrise-sunset"](name)} lead={sunLead(t, locale, place)}>
        <JsonLd data={pageSchema} />
        <SunView t={t} locale={locale} place={place} />
      </CityFrame>
    );
  }

  /* ---- climate ---- */
  const months = climate!;
  if (month === undefined) {
    const input = climateProseInput(name, months);
    const f = climateFacts(months);
    return (
      <CityFrame {...frame} h1={t.city.h1.climate(name)} lead={t.prose.climate(input)}>
        <JsonLd
          data={[
            pageSchema,
            climateDatasetSchema({
              name: t.city.h1.climate(name),
              description: t.city.desc.climate(name, input),
              path: placePath(locale, country, place, "climate"),
              source: climateProvider(place.id).name,
              sourceUrl: climateProvider(place.id).url,
              license: climateProvider(place.id).license,
              period: CLIMATE_PERIOD,
              lat: place.lat,
              lon: place.lon,
            }),
          ]}
        />
        <Section title={t.views.climateChart}>
          <ClimateChart months={months} labels={t.months.map((_, i) => monthShort(i, locale))} ariaLabel={t.views.climateChart} />
          <ChartLegend t={t} />
        </Section>
        <Section title={t.views.monthlyTable}>
          <ClimateTable t={t} locale={locale} place={place} country={country} months={months} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.views.climateSource(climateProvider(place.id).name, CLIMATE_PERIOD)} ({climateProvider(place.id).license})
          </p>
        </Section>
        <Section title={t.views.bestTime}>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {months.map((m, i) => {
              const v = verdict(monthComfort(m));
              const color = { great: "#10b981", good: "#84cc16", fair: "#eab308", poor: "#94a3b8" }[v];
              return (
                <li key={i}>
                  <Link
                    href={placePath(locale, country, place, "climate", i)}
                    className={`block rounded-xl px-2 py-2 text-center text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 ${f.best.includes(i) ? "ring-2 ring-white/80" : ""}`}
                    style={{ backgroundColor: color }}
                  >
                    {t.months[i]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
        <Faq title={t.city.faqTitle} items={t.faq.climate(input)} />
      </CityFrame>
    );
  }

  /* ---- climate month ---- */
  const m = months[month];
  const input = monthProseInput(name, months, month, place);
  const verdictText = t.prose.verdicts[input.verdict](name, month);
  const packText = t.prose.pack[wearTier(m.hi * 0.6 + m.lo * 0.4)];
  return (
    <CityFrame {...frame} h1={t.city.h1.month(name, month)} lead={t.prose.month(input)}>
      <JsonLd data={pageSchema} />
      <Section title={t.views.monthStats}>
        <StatGrid
          items={[
            { label: t.tables.avgHigh, value: <Temp c={m.hi} /> },
            { label: t.tables.avgLow, value: <Temp c={m.lo} /> },
            { label: t.tables.precip, value: `${Math.round(m.p)} mm` },
            ...(m.pd !== undefined ? [{ label: t.tables.wetDays, value: Math.round(m.pd) }] : []),
            ...(m.sun !== undefined ? [{ label: t.tables.sunHours, value: `${m.sun.toFixed(1)} ${t.tables.perDay}` }] : []),
            ...(m.sd !== undefined ? [{ label: t.tables.snowDays, value: Math.round(m.sd) }] : []),
            { label: t.views.daylightMid, value: input.daylight },
            ...(m.rhi !== undefined ? [{ label: t.views.recordHigh, value: <Temp c={m.rhi} /> }] : []),
            ...(m.rlo !== undefined ? [{ label: t.views.recordLow, value: <Temp c={m.rlo} /> }] : []),
          ]}
        />
      </Section>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <Section title={t.views.bestTime}>
          <p className="text-sm leading-relaxed">{verdictText}</p>
        </Section>
        <Section title={t.views.whatToPack}>
          <p className="text-sm leading-relaxed">{packText}</p>
        </Section>
      </div>
      <Section title={t.views.compareYear} aside={<span className="text-xs text-slate-500 dark:text-slate-400">{t.views.rank(input.annualRank)}</span>}>
        <ClimateChart months={months} labels={t.months.map((_, i) => monthShort(i, locale))} highlight={month} ariaLabel={t.views.climateChart} />
        <ChartLegend t={t} />
      </Section>
      <Section title={t.views.otherMonths}>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {months.map((x, i) => (
            <li key={i}>
              <Link
                href={placePath(locale, country, place, "climate", i)}
                aria-current={i === month ? "page" : undefined}
                className={`glass-soft block rounded-xl px-2 py-1.5 text-center text-xs ${i === month ? "font-bold ring-2 ring-sky-400" : "hover:-translate-y-0.5"}`}
              >
                <span className="block font-semibold">{t.months[i]}</span>
                <span className="tabular text-slate-500 dark:text-slate-400">
                  <Temp c={x.hi} /> / <Temp c={x.lo} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <Link href={placePath(locale, country, place, "climate")} className="font-medium text-sky-600 hover:underline dark:text-sky-300">
            {t.city.climateLink(name)} →
          </Link>
        </p>
      </Section>
      <Faq title={t.city.faqTitle} items={t.faq.month(input, verdictText, packText)} />
    </CityFrame>
  );
}

/* ------------------------------------------------------- sub-components */

function DayChip({ t, day }: { t: Dictionary; day: DailyPoint }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <WeatherIcon code={day.code} className="h-6 w-6" animated={false} />
      {describe(t, day.code)}
    </span>
  );
}

function HourTable({
  t,
  locale,
  tz,
  hours,
  dayHeaders = false,
}: {
  t: Dictionary;
  locale: Locale;
  tz: string;
  hours: Forecast["hourly"];
  dayHeaders?: boolean;
}) {
  return (
    <div className={tableWrap}>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>{t.tables.hour}</th>
            <th className={thClass}>{t.common.conditions}</th>
            <th className={thClass}>{t.common.temperature}</th>
            <th className={thClass}>{t.tables.feels}</th>
            <th className={thClass}>{t.tables.chance}</th>
            <th className={thClass}>{t.tables.amount}</th>
            <th className={thClass}>{t.common.wind}</th>
          </tr>
        </thead>
        <tbody>
          {hours.flatMap((h, i) => {
            const key = dayKey(h.time, tz);
            const rows = [];
            if (dayHeaders && (i === 0 || dayKey(hours[i - 1].time, tz) !== key)) {
              rows.push(
                <tr key={`d${key}`}>
                  <th colSpan={7} scope="colgroup" className="px-2 pt-4 pb-1 text-left text-xs font-bold tracking-wide text-slate-600 uppercase dark:text-slate-300">
                    {dayLabel(h.time, tz, locale)}
                  </th>
                </tr>
              );
            }
            const wet = h.pop >= 0.4;
            rows.push(
              <tr key={h.time} className={wet ? "bg-sky-400/10" : undefined}>
                <td className={`${tdClass} font-semibold`}>{formatHour(h.time, tz, locale)}</td>
                <td className={tdClass}>
                  <span className="flex items-center gap-1.5">
                    <WeatherIcon code={h.code} night={!h.isDay} className="h-6 w-6 shrink-0" animated={false} />
                    <span className="truncate">{describe(t, h.code)}</span>
                  </span>
                </td>
                <td className={`${tdClass} font-bold`}>
                  <Temp c={h.temp} />
                </td>
                <td className={tdClass}>
                  <Temp c={h.feelsLike} />
                </td>
                <td className={tdClass}>{Math.round(h.pop * 100)} %</td>
                <td className={tdClass}>{h.precipitation > 0 ? `${h.precipitation.toFixed(1)} mm` : "—"}</td>
                <td className={tdClass}>
                  <Speed ms={h.windSpeed} /> {t.highlights.compass[compassIndex(h.windDir)]}
                </td>
              </tr>
            );
            return rows;
          })}
        </tbody>
      </table>
    </div>
  );
}

function DayTable({ t, locale, tz, days }: { t: Dictionary; locale: Locale; tz: string; days: DailyPoint[] }) {
  return (
    <div className={tableWrap}>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>{t.common.day}</th>
            <th className={thClass}>{t.common.conditions}</th>
            <th className={thClass}>{t.tables.highLow}</th>
            <th className={thClass}>{t.common.precipitation}</th>
            <th className={thClass}>{t.tables.chance}</th>
            <th className={thClass}>{t.common.wind}</th>
            <th className={thClass}>UV</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d.date}>
              <th scope="row" className={`${tdClass} text-left font-semibold capitalize`}>
                {i === 0 ? t.common.today : i === 1 ? t.common.tomorrow : formatWeekday(d.time, tz, locale, "short")}
                <span className="block text-[0.7rem] font-normal text-slate-500 dark:text-slate-400">
                  {formatDayMonth(d.time, tz, locale)}
                </span>
              </th>
              <td className={tdClass}>
                <span className="flex items-center gap-1.5">
                  <WeatherIcon code={d.code} className="h-7 w-7 shrink-0" animated={false} />
                  <span>{describe(t, d.code)}</span>
                </span>
              </td>
              <td className={tdClass}>
                <strong>
                  <Temp c={d.tempMax} />
                </strong>{" "}
                / <Temp c={d.tempMin} />
              </td>
              <td className={tdClass}>{d.precipitation >= 0.1 ? `${d.precipitation.toFixed(1)} mm` : "—"}</td>
              <td className={tdClass}>{d.pop === null ? "—" : `${Math.round(d.pop * 100)} %`}</td>
              <td className={tdClass}>
                <Speed ms={d.windMax} /> {t.highlights.compass[compassIndex(d.windDir)]}
              </td>
              <td className={tdClass}>
                {d.uvMax === null ? (
                  "—"
                ) : (
                  <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: UV_COLORS[uvLevel(d.uvMax)] }}>
                    {Math.round(d.uvMax)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartLegend({ t }: { t: Dictionary }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[3px] w-5 rounded-full bg-orange-500" />
        {t.tables.avgHigh}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[3px] w-5 rounded-full bg-blue-500" />
        {t.tables.avgLow}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-400/50" />
        {t.tables.precip} (mm)
      </span>
    </div>
  );
}

function ClimateTable({
  t,
  locale,
  place,
  country,
  months,
}: {
  t: Dictionary;
  locale: Locale;
  place: Place;
  country: Country;
  months: MonthNormals[];
}) {
  const hasPd = months.some((m) => m.pd !== undefined);
  const hasSun = months.some((m) => m.sun !== undefined);
  const hasSnow = months.some((m) => m.sd !== undefined);
  return (
    <div className={tableWrap}>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>{t.tables.month}</th>
            <th className={thClass}>{t.tables.avgHigh}</th>
            <th className={thClass}>{t.tables.avgLow}</th>
            <th className={thClass}>{t.tables.precip}</th>
            {hasPd && <th className={thClass}>{t.tables.wetDays}</th>}
            {hasSun && <th className={thClass}>{t.tables.sunHours}</th>}
            {hasSnow && <th className={thClass}>{t.tables.snowDays}</th>}
          </tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={i}>
              <th scope="row" className={`${tdClass} text-left font-semibold`}>
                <Link href={placePath(locale, country, place, "climate", i)} className="text-sky-700 hover:underline dark:text-sky-300">
                  {t.months[i]}
                </Link>
              </th>
              <td className={`${tdClass} font-bold`}>
                <Temp c={m.hi} />
              </td>
              <td className={tdClass}>
                <Temp c={m.lo} />
              </td>
              <td className={tdClass}>{Math.round(m.p)} mm</td>
              {hasPd && <td className={tdClass}>{m.pd === undefined ? "—" : Math.round(m.pd)}</td>}
              {hasSun && <td className={tdClass}>{m.sun === undefined ? "—" : `${m.sun.toFixed(1)} ${t.tables.perDay}`}</td>}
              {hasSnow && <td className={tdClass}>{m.sd === undefined ? "—" : Math.round(m.sd)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClimateTeaser({
  locale,
  place,
  country,
  months,
}: {
  locale: Locale;
  place: Place;
  country: Country;
  months: MonthNormals[];
}) {
  const t = getDictionary(locale);
  const f = climateFacts(months);
  return (
    <Section title={t.city.climateTeaser}>
      <StatGrid
        items={[
          { label: `${t.tables.avgHigh} · ${t.months[f.warmest]}`, value: <Temp c={months[f.warmest].hi} /> },
          { label: `${t.tables.avgLow} · ${t.months[f.coldest]}`, value: <Temp c={months[f.coldest].lo} /> },
          { label: `${t.tables.precip} · ${t.months[f.wettest]}`, value: `${Math.round(months[f.wettest].p)} mm` },
          { label: t.views.bestTime, value: f.best.map((m) => monthShort(m, locale)).join(", ") },
        ]}
      />
      <p className="mt-3 text-sm">
        <Link href={placePath(locale, country, place, "climate")} className="font-medium text-sky-600 hover:underline dark:text-sky-300">
          {t.city.climateLink(place[locale])} →
        </Link>
      </p>
    </Section>
  );
}

/* ------------------------------------------------------- sun & moon */

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function sunForDate(place: Place, date: string) {
  return sunTimes(localNoonUtc(date, place.lon), place.lat, place.lon);
}

function sunLead(t: Dictionary, locale: Locale, place: Place): string {
  const today = dayKey(renderTime(), place.tz);
  const s = sunForDate(place, today);
  const y = sunForDate(place, addDays(today, -1));
  if (s.sunrise === null || s.sunset === null) return s.daylight > 0 ? t.prose.polarDay : t.prose.polarNight;
  const change = y.sunrise !== null && y.sunset !== null ? (s.sunset - s.sunrise - (y.sunset - y.sunrise)) / 60 : null;
  return t.prose.sun(
    place[locale],
    formatTime(s.sunrise, place.tz, locale),
    formatTime(s.sunset, place.tz, locale),
    formatDuration(s.daylight),
    change
  );
}

function SunView({ t, locale, place }: { t: Dictionary; locale: Locale; place: Place }) {
  const tz = place.tz;
  const now = renderTime();
  const today = dayKey(now, tz);
  const rows = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i);
    const s = sunForDate(place, date);
    const prev = sunForDate(place, addDays(date, -1));
    const len = s.sunrise !== null && s.sunset !== null ? s.sunset - s.sunrise : s.daylight * 60;
    const prevLen = prev.sunrise !== null && prev.sunset !== null ? prev.sunset - prev.sunrise : prev.daylight * 60;
    return { date, s, len, change: len - prevLen };
  });
  const moon = moonPhase(now);
  const next = nextMoonEvents(now);
  const year = Number(today.slice(0, 4));
  const solstices = [
    { label: t.views.juneSolstice, date: `${year}-06-21` },
    { label: t.views.decemberSolstice, date: `${year}-12-21` },
  ].map((x) => ({ ...x, s: sunForDate(place, x.date) }));

  const fmtChange = (sec: number) => {
    const sign = sec > 0 ? "+" : sec < 0 ? "−" : "±";
    const abs = Math.abs(Math.round(sec));
    return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
  };
  const time = (unix: number | null) => (unix === null ? "—" : formatTime(unix, tz, locale));
  const noonOf = (date: string) => Math.floor(localNoonUtc(date, place.lon) / 1000);

  return (
    <>
      <Section title={t.views.next30}>
        <div className={tableWrap}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>{t.common.date}</th>
                <th className={thClass}>{t.common.sunrise}</th>
                <th className={thClass}>{t.common.sunset}</th>
                <th className={thClass}>{t.common.daylight}</th>
                <th className={thClass}>{t.tables.change}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.date} className={i === 0 ? "bg-amber-400/10" : undefined}>
                  <th scope="row" className={`${tdClass} text-left font-semibold capitalize`}>
                    {dayLabel(noonOf(row.date), tz, locale)}
                  </th>
                  <td className={tdClass}>{time(row.s.sunrise)}</td>
                  <td className={tdClass}>{time(row.s.sunset)}</td>
                  <td className={tdClass}>{formatDuration(row.len / 60)}</td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400`}>{fmtChange(row.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t.views.sunNote}</p>
      </Section>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <Section title={t.views.moonTitle}>
          <StatGrid
            items={[
              { label: t.views.moonToday, value: t.sun.moonPhases[moon.phase] },
              { label: t.views.illumination, value: `${Math.round(moon.illumination * 100)} %` },
              { label: t.views.nextFull, value: formatLongDayMonth(next.full, tz, locale) },
              { label: t.views.nextNew, value: formatLongDayMonth(next.new, tz, locale) },
            ]}
          />
        </Section>
        <Section title={t.views.solstices}>
          <ul className="space-y-2">
            {solstices.map((x) => (
              <li key={x.date} className="glass-soft rounded-xl px-3 py-2 text-sm">
                <span className="block font-semibold">
                  {x.label} · {formatLongDayMonth(noonOf(x.date), tz, locale)}
                </span>
                <span className="tabular text-slate-600 dark:text-slate-300">
                  {time(x.s.sunrise)} – {time(x.s.sunset)} · {formatDuration(x.s.daylight)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
