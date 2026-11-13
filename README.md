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
`/weather` lists all countries. Hubs of countries with a single city are
`noindex, follow` and left out of the sitemap, since they only repeat that
city's page. All URLs are built in `src/lib/routes.ts`.

**Rendering.** City and country pages use ISR: they render on first request,
are cached, and refresh at most hourly (`export const revalidate = 3600`).
`expireTime` in `next.config.ts` caps how stale a cached page may get (2 h):
an older page is regenerated before it is served, which matters for the
tomorrow, hourly, 14-day and air-quality views because they don't refresh in
the browser. Forecast data is fetched on the server, so the HTML already
contains the forecast, a generated summary paragraph and an FAQ. After
hydration the overview dashboard calls Open-Meteo directly from the browser to
stay fresh.

If Open-Meteo fails while a page renders, the overview still renders and loads
its data in the browser. The tomorrow, hourly, 14-day and air-quality views
and the embeddable widget have no browser fallback, so they throw instead: during a background
regeneration ISR keeps serving the last good version, and failed fetches are
not cached, so the next request retries. A page that was never rendered shows
the error page (500, not cached).

`src/lib/places.ts` and `src/lib/climate.ts` import `server-only`: their
datasets (about 100 kB and 260 kB) must never end up in the browser bundle.

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
- Climate pages that would show exactly the numbers of a more populous place
  with the same station or grid cell (`origins` in `climate.json`) are
  `noindex, follow` and left out of the sitemap (`isClimateIndexed` in
  `src/lib/climate.ts`). A shared origin alone isn't enough: normals are
  corrected to each place's elevation, so a mountain resort that borrows a
  valley station gets its own numbers and stays indexed.
- City meta descriptions quote no live numbers: search engines keep a snippet
  for days, long after a "current" temperature has changed.

**Security headers** (`next.config.ts`): `nosniff`, a strict referrer policy,
a permissions policy that only allows geolocation, and
`frame-ancestors 'self'` everywhere except `/embed/…`, which third-party sites
frame.

**Widget.** `/widget` (and `/cs/widget`) generates an embed snippet: an iframe
pointing to `/embed/{lang}/{country}/{city}` (noindex), followed by a visible
credit link. Only that credit link outside the iframe counts as a backlink
from the embedding site.

## Data

- **Forecasts, air quality, geocoding:** [Open-Meteo](https://open-meteo.com/)
  (CC BY 4.0, no key needed). The free tier is non-commercial and rate-limited
  (10,000 calls/day per IP; requests with many variables count as several
  calls). Server requests are cached for an hour and shared by every page and
  language of a city. Even so, if most of the ~440 cities are regenerated every
  hour (a busy site, or crawlers working through the sitemap), the server
  alone can exceed the free quota — and on Vercel the outbound IPs are shared
  with other projects. Set `OPEN_METEO_API_KEY` in production to avoid 429s,
  which would leave pages without server-rendered data for an hour.
- **Places:** `scripts/build-places.mjs` produces `src/data/places.json` and
  `src/data/countries.json`. It starts from `scripts/seed-cities.json` plus an
  extra list inside the script, resolves each place through the Open-Meteo
  geocoding API, and adds English and Czech names and slugs. Names,
  coordinates, population and elevation come from
  [GeoNames](https://www.geonames.org/) (CC BY 4.0, credited in the footer).
- **Climate normals (1991–2020):** `scripts/build-climate.mjs` produces
  `src/data/climate.json`.
  - **Stations first.** Temperatures come from [Meteostat](https://meteostat.net/)
    stations (CC BY-NC 4.0, so non-commercial use only) for 406 of 440 places.
    Published normals are used where complete. Otherwise normals are computed
    from the station's daily data, with missing years filled in from NASA
    POWER anomalies.
  - **Elevation.** Station values are corrected to the place elevation with
    seasonal lapse rates (weaker in winter, when inversions are common).
  - **Precipitation** comes from the same station, a nearby one, or NASA POWER.
    It isn't elevation-corrected, so a station more than 250 m above or below
    the place must roughly agree with POWER (within a factor of 2), as must any
    total computed from daily data. Pages credit both providers when they differ.
  - **Fallback.** [NASA POWER](https://power.larc.nasa.gov/) daily data
    (public domain), lapse-corrected, is used only where no usable station
    exists. Its grid cells are coarse, so the script flags places where POWER
    looks unrepresentative (squeezed day/night range on coasts, large height
    difference in mountains) and searches farther for a station first.
  - **Provenance.** `sources`, `precipSources` and `origins` record where each
    place's numbers come from. A test (`src/lib/places.test.ts`) rejects
    implausible normals.
- **Sun and moon:** calculated astronomically (`src/lib/astro.ts`), with no API
  calls.

Regenerate the datasets with `npm run data`. A cold run takes about 20 minutes
(mostly NASA POWER); downloads are cached in `$DATA_CACHE_DIR`, which defaults
to `.cache/data` in the repo (git-ignored). Keep that cache: a re-run then works
offline and GeoNames ids stay stable. A 404 is cached too (Meteostat has no
file for many stations); `DATA_RETRY_404=1 npm run data` asks again. POWER
responses missing a parameter are used for that run only and never cached.

URL slugs are published URLs, so `build-places.mjs` keeps every slug already in
`places.json` / `countries.json` (by place id and country code), even when
GeoNames renames a place or Node's ICU data renames a country. A new namesake
gets a region suffix instead of renaming the existing city. When GeoNames
re-issues a place under a new id, the one new place in that country that would
have had the old slug takes over all of the old id's slugs (both languages).
Review the `*` notes the script prints: they list kept slugs whose names
changed, re-issued ids, places that moved to another country and removed
places, whose URLs will start returning 404. The logic lives in
`scripts/lib/slugs.mjs` and is covered by tests. Every slug must match
`^[a-z0-9]+(-[a-z0-9]+)*$`; names that fold to nothing (non-Latin script) fall
back to the English name, then to the id.

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
npm test        # unit tests (Vitest): routes, forecast shaping, astronomy, data, copy
npm run icons   # favicons, PWA icons, social card and manifest screenshots
```

`npm run icons` needs ImageMagick (`magick`) for the `.ico`, and renders text
with Avenir Next where available, so regenerate the text-bearing images on
macOS to keep their look.

Homepage geolocation (`/api/locate`) reads Vercel's IP headers, so it only
guesses a city when deployed on Vercel.

## Licence

MIT — see [LICENSE](LICENSE). Weather data © Open-Meteo.com (CC BY 4.0). Place
data © GeoNames (CC BY 4.0). Climate normals: Meteostat (CC BY-NC 4.0) and NASA
POWER (public domain).
Created by [Robert Libsansky](https://github.com/RobertLib).
