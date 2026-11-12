# WeatherNow

Fast, ad-free weather forecasts for cities worldwide, in English and Czech: live
conditions, hourly and 14-day forecasts, air quality and pollen, sunrise and
sunset times, and monthly climate averages.

Live: <https://www.weather-now.app>

## How the site is built

**Indexable pages per city.** Every curated city (`src/data/places.json`, ~440
places) gets its own server-rendered pages, in both languages:

| View | English | Czech |
| --- | --- | --- |
| Overview | `/weather/czechia/prague` | `/cs/pocasi/cesko/praha` |
| Tomorrow | `…/tomorrow` | `…/zitra` |
| Hourly (48 h) | `…/hourly` | `…/po-hodinach` |
| 14 days | `…/14-day` | `…/14-dni` |
| Air quality and pollen | `…/air-quality` | `…/kvalita-vzduchu` |
| Sunrise and sunset (30 days) | `…/sunrise-sunset` | `…/vychod-a-zapad-slunce` |
| Climate by month | `…/climate`, `…/climate/november` | `…/podnebi`, `…/podnebi/listopad` |

Each country has a hub page (`/weather/czechia`) with current temperatures, and
`/weather` lists all countries. All URLs are built in `src/lib/routes.ts`.

**Rendering.** City and country pages use ISR: they render on first request,
are cached, and refresh at most hourly (`export const revalidate = 3600`).
Forecast data is fetched on the server, so the HTML already contains the
forecast, a generated summary paragraph and an FAQ. After hydration the
dashboard calls Open-Meteo directly from the browser to stay fresh.

**Languages.** English lives at the root and Czech under `/cs`, as two route
groups with their own root layouts (`src/app/(en)`, `src/app/(cs)/cs`). Route
files are thin wrappers around shared views in `src/views`. All UI text, the
generated sentences and the FAQs live in `src/i18n/en.ts` and `src/i18n/cs.ts`.

**SEO.**
- Every page has a canonical URL and hreflang alternates (`src/lib/seo.ts`).
- Pages carry JSON-LD: WebSite, BreadcrumbList, WebPage + City, FAQPage, and
  Dataset on climate pages (`src/lib/schema.ts`).
- A sitemap index at `/sitemap.xml` points to split sitemaps under
  `/sitemaps/sitemap/{pages,en,cs}.xml`.
- Internal links: the footer links to popular cities and countries, and each
  city page links to the same view for its nearest cities.

**Widget.** `/widget` (and `/cs/widget`) generates an embed snippet: an iframe
pointing to `/embed/{lang}/{country}/{city}` (noindex), followed by a visible
credit link. Only that credit link outside the iframe counts as a backlink
from the embedding site.

## Data

- **Forecasts, air quality, geocoding:** [Open-Meteo](https://open-meteo.com/)
  (CC BY 4.0, no key needed). The free tier is non-commercial and rate-limited
  (10,000 calls/day per IP; requests with many variables count as several
  calls). Server requests are cached for an hour and shared by every page and
  language of a city.
- **Places:** `scripts/build-places.mjs` produces `src/data/places.json` and
  `src/data/countries.json`. It starts from `scripts/seed-cities.json` plus an
  extra list inside the script, resolves each place through the Open-Meteo
  geocoding API (GeoNames), and adds English and Czech names and slugs.
- **Climate normals (1991–2020):** `scripts/build-climate.mjs` produces
  `src/data/climate.json`. Data comes from [Meteostat](https://meteostat.net/)
  station normals (CC BY-NC 4.0, so non-commercial use only) where a suitable
  station exists, and from [NASA POWER](https://power.larc.nasa.gov/) daily
  data with a lapse-rate correction elsewhere. Each place records which source
  it uses, and every climate page credits it.
- **Sun and moon:** calculated astronomically (`src/lib/astro.ts`), with no API
  calls.

Regenerate the datasets with `npm run data`. A cold run takes about 20 minutes
(mostly NASA POWER); downloads are cached in `$DATA_CACHE_DIR`, which defaults
to `<os tmp>/weather-now-data-cache`. Keep URL slugs stable once pages are
indexed.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPEN_METEO_API_KEY` | no | Paid Open-Meteo key for server-side requests (customer endpoints with their own quota). Never exposed to the browser. |

The old `NEXT_PUBLIC_OPENWEATHER_API_KEY` is no longer used and can be removed.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # type-check and production build
npm run lint
```

Homepage geolocation (`/api/locate`) reads Vercel's IP headers, so it only
guesses a city when deployed on Vercel.

## Licence

MIT — see [LICENSE](LICENSE). Weather data © Open-Meteo.com (CC BY 4.0).
Created by [Robert Libsansky](https://github.com/RobertLib).
