/**
 * English dictionary. `cs.ts` must provide the same shape (enforced by the
 * `Dictionary` type). Functions receive pre-formatted times and raw numbers in
 * metric units; temperatures in prose show both °C and °F for English readers.
 */

const r = (n: number) => Math.round(n);
const f = (c: number) => Math.round((c * 9) / 5 + 32);
const T = (c: number) => `${r(c)} °C (${f(c)} °F)`;
/** For use inside parentheses, where nested brackets would read badly. */
const T2 = (c: number) => `${r(c)} °C / ${f(c)} °F`;
const pct = (p: number) => `${r(p * 100)}%`;
const mm = (v: number) => `${v < 10 ? v.toFixed(1) : r(v)} mm`;
const kmh = (ms: number) => `${r(ms * 3.6)} km/h`;
const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
const sunSentence = (sun: SunLine) =>
  "rise" in sun
    ? `The sun rises at ${sun.rise} and sets at ${sun.set}.`
    : sun.polar === "day"
      ? "The sun doesn't set (polar day)."
      : "The sun doesn't rise (polar night).";
const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface DayBrief {
  cond: string;
  hi: number;
  lo: number;
  pop: number | null;
  precip: number;
  windMax: number;
  uvMax: number | null;
  label: string;
}

export interface OverviewProse {
  name: string;
  temp: number;
  feels: number;
  cond: string;
  time: string;
  today: DayBrief | null;
  tomorrow: DayBrief | null;
  rainPop: number;
  rainAt: string | null;
  week: {
    hiMin: number;
    hiMax: number;
    wetDays: number;
    days: number;
    warmestLabel: string;
    warmestHi: number;
  } | null;
  sunrise: string | null;
  sunset: string | null;
  /** Set when the sun doesn't rise or set today (no sunrise/sunset then). */
  polar: "day" | "night" | null;
}

/** Sunrise and sunset for one day, or the polar day/night that replaces them. */
export type SunLine = { rise: string; set: string } | { polar: "day" | "night" };

export interface RangeProse {
  name: string;
  days: number;
  hiMin: number;
  hiMax: number;
  warmestLabel: string;
  warmestHi: number;
  coldestLabel: string;
  coldestLo: number;
  wettestLabel: string;
  wettestPrecip: number;
  wetDays: number;
  trend: number;
}

export interface ClimateProse {
  name: string;
  warmest: number;
  warmestHi: number;
  coldest: number;
  coldestLo: number;
  wettest: number;
  wettestP: number;
  driest: number;
  driestP: number;
  sunniest: number | null;
  best: number[];
  annualPrecip: number;
  annualMean: number;
  frostMonths: number;
}

export interface MonthProse {
  name: string;
  month: number;
  hi: number;
  lo: number;
  p: number;
  pd?: number;
  sun?: number;
  sd?: number;
  rhi?: number;
  rlo?: number;
  daylight: string;
  prevHi: number;
  prevMonth: number;
  verdict: "great" | "good" | "fair" | "poor";
  annualRank: number;
}

const en = {
  meta: {
    siteName: "WeatherNow",
    tagline: "Real-time weather forecasts for every city",
    description:
      "Accurate hourly and 14-day weather forecasts, air quality, sunrise times and climate averages for cities worldwide. Fast, free and ad-free.",
    ogAlt: "WeatherNow — real-time weather forecasts",
  },

  nav: {
    main: "Main navigation",
    home: "Weather",
    countries: "Countries",
    widget: "Widget",
    about: "About",
    language: "Language",
    switchTo: "Česky",
  },

  footer: {
    blurb:
      "A fast, ad-free weather site: live conditions, readable trends and honest forecasts for anywhere on Earth.",
    source: "Source on GitHub",
    popular: "Popular forecasts",
    countries: "Countries",
    allCountries: "All countries",
    project: "Project",
    about: "About",
    privacy: "Privacy policy",
    terms: "Terms of service",
    widget: "Free weather widget",
    data: "Weather data by",
    climateData: "Climate normals:",
    copyright: (year: number) => `© ${year} WeatherNow by Robert Libsansky.`,
    disclaimer:
      "Forecasts and ratings shown here are informational. Always check your national weather service for warnings and severe-weather alerts.",
  },

  common: {
    loading: "Loading weather data…",
    retry: "Retry",
    dismiss: "Dismiss this message",
    now: "Now",
    today: "Today",
    tomorrow: "Tomorrow",
    tonight: "Tonight",
    high: "High",
    low: "Low",
    wind: "Wind",
    gusts: "Gusts",
    feelsLike: "Feels like",
    humidity: "Humidity",
    precipitation: "Precipitation",
    rainChance: "Rain chance",
    uv: "UV index",
    sunrise: "Sunrise",
    sunset: "Sunset",
    daylight: "Daylight",
    sunshine: "Sunshine",
    time: "Time",
    day: "Day",
    date: "Date",
    conditions: "Conditions",
    temperature: "Temperature",
    localTime: "local time",
    km: (n: number) => `${n} km`,
    updatedAgo: (rel: string) => `updated ${rel}`,
    justNow: "just now",
    minAgo: (n: number) => `${n} min ago`,
    hoursAgo: (n: number) => (n === 1 ? "1 hour ago" : `${n} hours ago`),
    units: "Measurement units",
    theme: "Colour theme",
    themeLight: "Light theme",
    themeDark: "Dark theme",
    themeSystem: "Match system theme",
    breadcrumb: "Breadcrumb",
    home: "Home",
    world: "Weather",
  },

  errors: {
    generic: "Something went wrong while loading the weather.",
    rateLimited: "The weather service is busy right now — please try again in a moment.",
    offline: "You seem to be offline. Check your connection and try again.",
    geoUnsupported: "Geolocation isn't supported in this browser.",
    geoFailed: "We couldn't get your location. Try searching for a city instead.",
    notFoundTitle: "Page not found",
    notFoundText: "We couldn't find that page. Try searching for a city instead.",
    backHome: "Back to the forecast",
    errorTitle: "Something went wrong",
    errorText: "This page couldn't be displayed. Please try again in a moment.",
  },

  search: {
    aria: "Weather search",
    label: "Search for a city to get its weather",
    placeholder: "Search any city…",
    submit: "Search",
    locate: "Use my current location",
    clear: "Clear search",
    suggestions: "City suggestions",
    popular: "Popular right now",
    noMatch: "No match yet — keep typing the city name.",
    searching: "Searching…",
    yourLocation: "Your location",
  },

  favorites: {
    heading: "Your places",
    save: "Save to your places",
    unsave: "Remove from your places",
    remove: (name: string) => `Remove ${name} from your places`,
    saved: (name: string) => `${name} saved to your places`,
    removed: (name: string) => `${name} removed from your places`,
    limit: (n: number) => `You can save up to ${n} places`,
  },

  current: {
    aria: "Current conditions",
    share: "Share this forecast",
    refresh: "Refresh weather data",
    copied: "Link copied to clipboard",
    copyFailed: "Couldn't copy the link",
    shareText: (name: string, temp: string, cond: string) => `${name}: ${temp}, ${cond}`,
  },

  highlights: {
    aria: "Today's details",
    dewPoint: (t: string, comfort: string) => `Dew point ${t} · ${comfort}`,
    dewComfort: ["Very dry", "Comfortable", "Pleasant", "Slightly humid", "Humid", "Oppressive"],
    windLevels: [
      "Calm",
      "Light breeze",
      "Moderate breeze",
      "Fresh wind",
      "Strong wind",
      "Gale",
      "Storm",
    ],
    compass: [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    ],
    pressure: "Pressure",
    trend: { rising: "Rising", falling: "Falling", steady: "Steady" },
    visibility: "Visibility",
    visibilityLevels: ["Very poor", "Hazy", "Fairly clear", "Crystal clear"],
    clouds: "Cloud cover",
    cloudLevels: ["Wide open sky", "Scattered clouds", "Mostly cloudy", "Fully overcast"],
    uvLevels: ["Low", "Moderate", "High", "Very high", "Extreme"],
    uvAdvice: [
      "No protection needed",
      "Sunscreen if you're out long",
      "Sunscreen and a hat",
      "Avoid the midday sun",
      "Stay in the shade",
    ],
    afterDark: "After dark",
    belowHorizon: "The sun is below the horizon",
  },

  hourly: {
    title: "Next 24 hours",
    subtitle: "Hour by hour, in local time",
  },

  chart: {
    title: "Temperature trend",
    subtitle: "Hover a point for the exact reading",
    temperature: "Temperature",
    feelsLike: "Feels like",
    pop: "Chance of precipitation",
    feels: "feels",
    aria: (min: string, max: string, hours: number) =>
      `Temperature trend from ${min} to ${max} over the next ${hours} hours`,
  },

  daily: {
    title: "Day by day",
    subtitle: (n: number) => `Next ${n} days — tap a row for details`,
    maxWind: "Max wind",
    uvMax: "UV max",
  },

  sun: {
    title: "Sun & moon",
    subtitle: (daylight: string) => `${daylight} of daylight`,
    next: (event: "sunrise" | "sunset"): string => (event === "sunset" ? "Sunset in" : "Sunrise in"),
    moonPhases: [
      "New moon",
      "Waxing crescent",
      "First quarter",
      "Waxing gibbous",
      "Full moon",
      "Waning gibbous",
      "Last quarter",
      "Waning crescent",
    ],
    illuminated: (pct: number) => `${pct}% illuminated`,
    fullTonight: "full tonight",
    fullIn: (n: number) => `full moon in ${days(n)}`,
    polar: {
      day: "Polar day — the sun doesn't set today",
      night: "Polar night — the sun doesn't rise today",
    },
  },

  air: {
    title: "Air quality",
    subtitle: "European AQI, 0 (clean) upwards",
    levels: ["Good", "Fair", "Moderate", "Poor", "Very poor", "Extremely poor"],
    advice: [
      "Air quality is ideal — enjoy being outside.",
      "Acceptable air quality for most people.",
      "Sensitive groups may want to limit long outdoor efforts.",
      "Consider shortening intense outdoor activity.",
      "Avoid strenuous outdoor activity; sensitive groups should stay in.",
      "Stay indoors where you can and keep windows closed.",
    ],
    usAqi: "US AQI",
    pollen: "Pollen",
    pollenTypes: {
      alder: "Alder",
      birch: "Birch",
      grass: "Grass",
      mugwort: "Mugwort",
      olive: "Olive",
      ragweed: "Ragweed",
    },
    pollenLevels: ["None", "Low", "Moderate", "High", "Very high"],
    unavailable: "Air quality data isn't available for this location right now.",
  },

  insights: {
    title: "What this means",
    subtitle: "Plain-language takeaways",
    feelsTitle: (t: string) => `Feels like ${t}`,
    wear: {
      arctic: "Heavy coat, hat and gloves — it bites out there.",
      winter: "Winter coat and a scarf will keep you comfortable.",
      jacket: "A jacket or warm layer is the right call.",
      layers: "Long sleeves or a light layer should be plenty.",
      light: "T-shirt weather — travel light.",
      hot: "Loose, light clothing and plenty of water.",
    },
    umbrellaTitle: "Take an umbrella",
    umbrellaText: (p: number, at: string) =>
      `${r(p * 100)}% chance of precipitation around ${at}.`,
    dryTitle: "Dry spell ahead",
    dryText: "No meaningful precipitation expected in the next 12 hours.",
    windTitle: "Windy conditions",
    windText: (kmhValue: number) =>
      `Gusts up to ${kmhValue} km/h — secure loose items outdoors.`,
    iceTitle: "Watch for ice",
    iceText: "Temperatures near freezing with high moisture — surfaces may be slippery.",
    bestTitle: (at: string) => `Best window: ${at}`,
    bestText: (t: string, p: number) =>
      `${t} with ${r(p * 100)}% rain chance — the pick of the next day.`,
    swingTitle: "Big temperature swing",
    swingText: (deg: number) =>
      `About ${deg}° between the high and low over the next 24 hours — dress in layers.`,
    dryAirTitle: "Very dry air",
    dryAirText: (h: number) => `Humidity is only ${h}% — keep a water bottle nearby.`,
    muggyTitle: "Muggy out",
    muggyText: (h: number) => `${h}% humidity makes it feel heavier than the thermometer says.`,
    uvTitle: "Strong sun",
    uvText: (uv: number) => `UV index peaks at ${r(uv)} today — sunscreen and sunglasses.`,
  },

  activities: {
    title: "Good day for…",
    winner: (label: string, emoji: string) => `Today's winner: ${label.toLowerCase()} ${emoji}`,
    labels: {
      running: "Running",
      cycling: "Cycling",
      terrace: "Terrace",
      laundry: "Line drying",
      stargazing: "Stargazing",
      photo: "Photography",
    },
    verdicts: ["Forget it", "Poor", "So-so", "Good", "Excellent"],
    note: "Scores blend temperature, wind, cloud cover and rain chance. For fun — use your own judgement.",
  },

  dashboard: {
    footnote: "Data from Open-Meteo · refreshes automatically every 10 minutes · press",
    footnoteKey: "to search",
  },

  /** WMO weather interpretation codes. */
  wmo: {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Light freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  } as Record<number, string>,

  continents: {
    EU: "Europe",
    AS: "Asia",
    NA: "North America",
    SA: "South America",
    AF: "Africa",
    OC: "Oceania",
  } as Record<string, string>,

  months: MONTHS,
  inMonth: (m: number) => `in ${MONTHS[m]}`,

  home: {
    title: "WeatherNow — Weather Forecast for Any City, Hourly & 14 Days",
    description:
      "Free, ad-free weather forecasts for any city in the world: current conditions, hourly and 14-day forecasts, air quality, sunrise times and climate averages.",
    h1: "Weather forecast for any city",
    lead: "Live conditions, hour-by-hour trends, a 14-day outlook, air quality and climate averages — for anywhere on Earth.",
    yourWeather: "Your weather",
    locating: "Finding your location…",
    openFull: (name: string) => `Full forecast for ${name}`,
    emptyTitle: "Let's find your weather",
    emptyText:
      "Search for any city or share your location to see live conditions, an hourly trend, air quality and a 14-day outlook.",
    popular: "Weather in popular cities",
    popularSub: "Current temperatures, updated hourly",
    browse: "Browse forecasts by country",
    allCountries: "All countries",
    whyTitle: "Why WeatherNow",
    why: [
      ["Hourly to 14 days", "Detailed hour-by-hour data for two days and a daily outlook for two weeks."],
      ["Plain language", "What to wear, when it will rain and the best hour to go outside — not just numbers."],
      ["Climate averages", "Monthly temperatures, rainfall and sunshine to plan trips months ahead."],
      ["No ads, no account", "Fast pages, no trackers, and your saved places stay in your browser."],
    ] as Array<[string, string]>,
  },

  world: {
    title: "Weather Around the World — Forecasts by Country",
    description: (n: number) =>
      `Browse weather forecasts for ${n} cities in countries around the world: hourly and 14-day forecasts, air quality and climate.`,
    h1: "Weather around the world",
    lead: (n: number, c: number) => `Forecasts for ${n} cities in ${c} countries. Pick a country to see all its cities.`,
    cities: (n: number) => (n === 1 ? "1 city" : `${n} cities`),
  },

  country: {
    title: (country: string) => `Weather in ${country} — Current Temperatures & Forecasts`,
    description: (country: string, n: number, sample: string) =>
      n === 1
        ? `Current weather and forecast for ${sample}, ${country}. Hourly, 14-day and climate data.`
        : `Current weather and forecasts for ${n} places in ${country}, including ${sample}. Hourly, 14-day and climate data.`,
    h1: (country: string) => `Weather in ${country}`,
    lead: (country: string, n: number) =>
      n === 1
        ? `Current temperature and conditions in ${country}. Select the place for its hourly and 14-day forecast.`
        : `Current temperatures and conditions in ${n} places across ${country}. Select a place for the hourly and 14-day forecast.`,
    warmest: (name: string, t: number) => `Warmest right now: ${name}, ${T(t)}.`,
    coldest: (name: string, t: number) => `Coldest: ${name}, ${T(t)}.`,
    place: "Place",
    region: "Region",
    now: "Now",
  },

  city: {
    tabs: {
      overview: "Overview",
      tomorrow: "Tomorrow",
      hourly: "Hourly",
      "14-day": "14 days",
      "air-quality": "Air quality",
      "sunrise-sunset": "Sunrise & sunset",
      climate: "Climate",
    } as Record<string, string>,
    tabsAria: "Forecast views",
    meta: {
      overview: (n: string, c: string) => `${n} Weather Forecast — Hourly & 14-Day | ${c}`,
      tomorrow: (n: string, c: string) => `${n} Weather Tomorrow — Hourly Forecast | ${c}`,
      hourly: (n: string, c: string) => `${n} Hourly Weather Forecast — Next 48 Hours | ${c}`,
      "14-day": (n: string, c: string) => `${n} 14-Day Weather Forecast | ${c}`,
      "air-quality": (n: string, c: string) => `Air Quality in ${n}, ${c} — AQI & Pollen Today`,
      "sunrise-sunset": (n: string, c: string) => `Sunrise & Sunset Times in ${n}, ${c}`,
      climate: (n: string, c: string) => `${n} Climate — Weather by Month & Best Time to Visit | ${c}`,
      month: (n: string, c: string, m: number) => `${n} Weather in ${MONTHS[m]} — Temperature, Rain & Sun | ${c}`,
    },
    desc: {
      overview: (n: string, now: string) =>
        `${n} weather now: ${now}. Hourly forecast, 14-day outlook, air quality, sunrise and sunset times.`,
      overviewNoData: (n: string) =>
        `${n} weather now, hourly forecast, 14-day outlook, air quality, sunrise and sunset times.`,
      tomorrow: (n: string) =>
        `Weather in ${n} tomorrow: hour-by-hour temperature, rain chance, wind and UV, plus sunrise and sunset.`,
      hourly: (n: string) =>
        `Hour-by-hour weather forecast for ${n}: temperature, feels-like, rain chance and wind for the next 48 hours.`,
      "14-day": (n: string) =>
        `14-day weather forecast for ${n}: daily highs and lows, rain, wind and UV for the next two weeks.`,
      "air-quality": (n: string) =>
        `Current air quality in ${n}: European and US AQI, PM2.5, PM10, ozone, NO₂ and pollen, plus a 4-day outlook.`,
      "sunrise-sunset": (n: string) =>
        `Sunrise, sunset and daylight length in ${n} for the next 30 days, plus moon phases and the solstices.`,
      climate: (n: string, p: ClimateProse) =>
        `Climate of ${n}: average temperatures, rainfall and sunshine by month. Warmest month ${MONTHS[p.warmest]}, best time to visit ${list(p.best.map((m) => MONTHS[m]))}.`,
      month: (n: string, m: number, hi: number, lo: number, p: number) =>
        `What's the weather like in ${n} in ${MONTHS[m]}? Average high ${r(hi)} °C, low ${r(lo)} °C, ${mm(p)} of precipitation. Plus what to pack.`,
    },
    h1: {
      overview: (n: string) => `${n} weather`,
      tomorrow: (n: string) => `${n} weather tomorrow`,
      hourly: (n: string) => `${n} hourly forecast`,
      "14-day": (n: string) => `${n} 14-day forecast`,
      "air-quality": (n: string) => `Air quality in ${n}`,
      "sunrise-sunset": (n: string) => `Sunrise and sunset in ${n}`,
      climate: (n: string) => `${n} climate: weather by month`,
      month: (n: string, m: number) => `${n} weather in ${MONTHS[m]}`,
    },
    faqTitle: "Frequently asked questions",
    nearby: "Weather nearby",
    moreIn: (country: string) => `All places in ${country}`,
    climateTeaser: "Climate at a glance",
    climateLink: (n: string) => `Full climate guide for ${n}`,
    dataUnavailable:
      "Live forecast data couldn't be loaded on the server just now — it will load in your browser in a moment.",
    elevation: (m: number) => `Elevation ${r(m)} m`,
    coords: "Coordinates",
    timezone: "Time zone",
    embedCta: "Put this forecast on your website",
  },

  prose: {
    overview: (p: OverviewProse) => {
      const parts = [`Right now in ${p.name} it's ${T(p.temp)} and ${p.cond.toLowerCase()}, feeling like ${T(p.feels)} as of ${p.time} local time.`];
      if (p.today)
        parts.push(
          `Today expect a high of ${T(p.today.hi)} and a low of ${T(p.today.lo)}${p.today.pop !== null ? `; the chance of precipitation is ${pct(p.today.pop)}` : ""}.`
        );
      if (p.rainPop >= 0.4 && p.rainAt)
        parts.push(`The best chance of rain in the next 24 hours is around ${p.rainAt}.`);
      if (p.tomorrow)
        parts.push(
          `Tomorrow: ${p.tomorrow.cond.toLowerCase()}, ${T(p.tomorrow.hi)} / ${T(p.tomorrow.lo)}.`
        );
      if (p.week)
        parts.push(
          `Over the next ${p.week.days} days highs range from ${r(p.week.hiMin)} to ${r(p.week.hiMax)} °C, with ${p.week.wetDays === 0 ? "no wet days" : days(p.week.wetDays) + " of rain or snow"} expected; ${p.week.warmestLabel} looks warmest.`
        );
      return parts.join(" ");
    },
    tomorrow: (n: string, d: DayBrief, sun: SunLine) =>
      `Tomorrow (${d.label}) ${n} can expect ${d.cond.toLowerCase()} with a high of ${T(d.hi)} and a low of ${T(d.lo)}. ` +
      (d.pop !== null ? `The chance of precipitation is ${pct(d.pop)}${d.precip >= 0.2 ? `, with about ${mm(d.precip)} in total` : ""}. ` : "") +
      `Winds reach ${kmh(d.windMax)}${d.uvMax !== null ? ` and the UV index peaks at ${r(d.uvMax)}` : ""}. ${sunSentence(sun)}`,
    hourly: (n: string, hours: number, min: number, max: number, wetHours: number) =>
      `Over the next ${hours} hours temperatures in ${n} range between ${T(min)} and ${T(max)}. ` +
      (wetHours === 0
        ? "No hour has a meaningful chance of precipitation."
        : `${wetHours} ${wetHours === 1 ? "hour has" : "hours have"} a precipitation chance of 40% or more — they are highlighted in the table below.`),
    range: (p: RangeProse) =>
      `The ${p.days}-day outlook for ${p.name} has daytime highs between ${T(p.hiMin)} and ${T(p.hiMax)}. ` +
      `The warmest day looks to be ${p.warmestLabel} (${T2(p.warmestHi)}), the coldest night ${p.coldestLabel} (${T2(p.coldestLo)}). ` +
      (p.wetDays === 0
        ? "No day is expected to bring 1 mm or more of precipitation. "
        : `${days(p.wetDays)} should bring 1 mm or more of precipitation, most of it on ${p.wettestLabel} (${mm(p.wettestPrecip)}). `) +
      (Math.abs(p.trend) < 2
        ? "Temperatures stay fairly steady through the period."
        : p.trend > 0
          ? `It turns warmer later on, by about ${r(p.trend)} °C.`
          : `It turns cooler later on, by about ${r(-p.trend)} °C.`),
    rangeNote:
      "Forecasts beyond 7 days show the general trend; individual days can still change, so check back closer to the date.",
    air: (n: string, aqi: number, level: string, advice: string, us: number | null) =>
      `The air quality in ${n} is currently ${level.toLowerCase()}, with a European AQI of ${r(aqi)}${us !== null ? ` (US AQI ${r(us)})` : ""}. ${advice}`,
    sun: (n: string, sunrise: string, sunset: string, daylight: string, change: number | null) =>
      `Today in ${n} the sun rises at ${sunrise} and sets at ${sunset}, giving ${daylight} of daylight.` +
      (change === null || Math.abs(change) < 1
        ? ""
        : change > 0
          ? ` Days are getting longer by about ${r(change)} minutes a day.`
          : ` Days are getting shorter by about ${r(-change)} minutes a day.`),
    polarDay: "The sun doesn't set today (polar day).",
    polarNight: "The sun doesn't rise today (polar night).",
    climate: (p: ClimateProse) =>
      `${p.name} is warmest in ${MONTHS[p.warmest]}, when highs average ${T(p.warmestHi)}, and coldest in ${MONTHS[p.coldest]}, with average lows of ${T(p.coldestLo)}. ` +
      `${MONTHS[p.wettest]} is the wettest month (${mm(p.wettestP)}) and ${MONTHS[p.driest]} the driest (${mm(p.driestP)}); about ${r(p.annualPrecip)} mm falls in a typical year. ` +
      (p.sunniest !== null ? `${MONTHS[p.sunniest]} gets the most sunshine. ` : "") +
      (p.frostMonths > 0 ? `Nights drop below freezing on average in ${p.frostMonths} ${p.frostMonths === 1 ? "month" : "months"} of the year. ` : "Average lows stay above freezing all year. ") +
      `For comfortable weather, the best time to visit is ${list(p.best.map((m) => MONTHS[m]))}.`,
    month: (p: MonthProse) =>
      `In ${MONTHS[p.month]}, ${p.name} typically sees daytime highs of ${T(p.hi)} and night-time lows of ${T(p.lo)}` +
      `${Math.abs(p.hi - p.prevHi) >= 1 ? ` — ${p.hi > p.prevHi ? "warmer" : "cooler"} than ${MONTHS[p.prevMonth]} by about ${r(Math.abs(p.hi - p.prevHi))} °C` : ""}. ` +
      `Expect around ${mm(p.p)} of precipitation${p.pd === undefined ? "" : p.pd < 0.5 ? ", and rainy days are rare" : ` spread over roughly ${days(r(p.pd))} with at least 1 mm`}` +
      `${p.sd !== undefined && p.sd >= 0.5 ? `, and snow falls on about ${days(r(p.sd))}` : ""}. ` +
      `${p.sun !== undefined ? `The sun shines for about ${r(p.sun)} ${r(p.sun) === 1 ? "hour" : "hours"} a day, and days are` : "Days are"} ${p.daylight} long mid-month. ` +
      `${p.rhi !== undefined && p.rlo !== undefined ? `Extremes in recent decades ranged from ${T(p.rlo)} to ${T(p.rhi)}.` : ""}`,
    verdicts: {
      great: (n: string, m: number) => `${MONTHS[m]} is one of the best months to visit ${n} — mild, comfortable weather for sightseeing.`,
      good: (n: string, m: number) => `${MONTHS[m]} is a good time to visit ${n}; the weather is mostly pleasant.`,
      fair: (n: string, m: number) => `${MONTHS[m]} is a so-so month for visiting ${n} — pack for changeable weather.`,
      poor: (n: string, m: number) => `${MONTHS[m]} is not the most comfortable month in ${n}, but it means fewer crowds; dress for the conditions.`,
    },
    pack: {
      arctic: "Pack a heavy winter coat, thermal layers, hat, gloves and waterproof boots.",
      winter: "Pack a warm coat, scarf and layers; waterproof shoes are a good idea.",
      jacket: "Pack a jacket, a warm jumper and an umbrella.",
      layers: "Pack light layers and a light jacket for the evenings.",
      light: "Pack light clothes, sunglasses and a light layer for the evening.",
      hot: "Pack breathable clothes, sunscreen, a hat and a refillable water bottle.",
    } as Record<string, string>,
  },

  faq: {
    overview: (p: OverviewProse) => {
      const items: Array<[string, string]> = [
        [
          `What's the weather like in ${p.name} right now?`,
          `As of ${p.time} local time it's ${T(p.temp)} and ${p.cond.toLowerCase()} in ${p.name}, and it feels like ${T(p.feels)}.`,
        ],
      ];
      if (p.today)
        items.push([
          `Will it rain in ${p.name} today?`,
          p.today.pop === null
            ? `Expect around ${mm(p.today.precip)} of precipitation today.`
            : p.today.pop < 0.2
              ? `Rain is unlikely today — the chance of precipitation is ${pct(p.today.pop)}.`
              : `The chance of precipitation today is ${pct(p.today.pop)}${p.today.precip >= 0.2 ? `, with about ${mm(p.today.precip)} expected` : ""}.`,
        ]);
      if (p.tomorrow)
        items.push([
          `What will the weather be like in ${p.name} tomorrow?`,
          `Tomorrow brings ${p.tomorrow.cond.toLowerCase()} with a high of ${T(p.tomorrow.hi)} and a low of ${T(p.tomorrow.lo)}${p.tomorrow.pop !== null ? `; the chance of precipitation is ${pct(p.tomorrow.pop)}` : ""}.`,
        ]);
      if (p.week)
        items.push([
          `What's the weather forecast for ${p.name} this week?`,
          `Highs range from ${r(p.week.hiMin)} to ${r(p.week.hiMax)} °C over the next ${p.week.days} days. The warmest looks to be ${p.week.warmestLabel} at ${T(p.week.warmestHi)}, and ${p.week.wetDays === 0 ? "no day is expected to be wet" : `${days(p.week.wetDays)} may bring rain or snow`}.`,
        ]);
      if (p.sunrise && p.sunset)
        items.push([
          `What time is sunrise and sunset in ${p.name} today?`,
          `The sun rises at ${p.sunrise} and sets at ${p.sunset} local time.`,
        ]);
      else if (p.polar)
        items.push([
          `What time is sunrise and sunset in ${p.name} today?`,
          p.polar === "day"
            ? `The sun doesn't set in ${p.name} today — it's polar day, with 24 hours of daylight.`
            : `The sun doesn't rise in ${p.name} today — it's polar night.`,
        ]);
      return items;
    },
    range: (p: RangeProse) =>
      [
        [
          `Will it rain in ${p.name} in the next ${p.days} days?`,
          p.wetDays === 0
            ? `No day in the next ${p.days} is expected to bring 1 mm or more of precipitation.`
            : `${days(p.wetDays)} should bring 1 mm or more of precipitation; the wettest looks to be ${p.wettestLabel}, with about ${mm(p.wettestPrecip)}.`,
        ],
        [`Which day will be the warmest in ${p.name}?`, `${p.warmestLabel} looks warmest, with a high of ${T(p.warmestHi)}.`],
        [`How cold will the nights get in ${p.name}?`, `The coldest night looks to be ${p.coldestLabel}, with a low of ${T(p.coldestLo)}.`],
        [
          `How reliable is the ${p.days}-day forecast for ${p.name}?`,
          "The next few days are the most dependable. Beyond about a week the forecast shows the general trend, and individual days can still change, so check back closer to the date.",
        ],
      ] as Array<[string, string]>,
    climate: (p: ClimateProse) =>
      [
        [`What is the warmest month in ${p.name}?`, `${MONTHS[p.warmest]} is the warmest month, with average highs of ${T(p.warmestHi)}.`],
        [`What is the coldest month in ${p.name}?`, `${MONTHS[p.coldest]} is the coldest month, with average lows of ${T(p.coldestLo)}.`],
        [`What is the rainiest month in ${p.name}?`, `${MONTHS[p.wettest]} gets the most precipitation, about ${mm(p.wettestP)} on average.`],
        [`When is the best time to visit ${p.name}?`, `For pleasant temperatures and less rain, aim for ${list(p.best.map((m) => MONTHS[m]))}.`],
      ] as Array<[string, string]>,
    month: (p: MonthProse, verdictText: string, packText: string) => {
      const items: Array<[string, string]> = [
        [`How warm is ${p.name} in ${MONTHS[p.month]}?`, `Average highs are ${T(p.hi)} and average lows ${T(p.lo)}.`],
        [
          `Does it rain a lot in ${p.name} in ${MONTHS[p.month]}?`,
          `About ${mm(p.p)} of precipitation falls on average${p.pd === undefined ? "" : p.pd < 0.5 ? "; rainy days are rare" : `, on roughly ${days(r(p.pd))}`}.`,
        ],
      ];
      if (p.sd !== undefined || p.lo < 2)
        items.push([
          `Does it snow in ${p.name} in ${MONTHS[p.month]}?`,
          p.sd !== undefined
            ? p.sd >= 0.5
              ? `Yes — snow falls on about ${days(r(p.sd))} in a typical ${MONTHS[p.month]}.`
              : "Snow is rare in this month."
            : "Snow is possible on the coldest days.",
        ]);
      items.push([`Is ${MONTHS[p.month]} a good time to visit ${p.name}?`, verdictText]);
      items.push([`What should I pack for ${p.name} in ${MONTHS[p.month]}?`, packText]);
      return items;
    },
    air: (n: string, level: string, aqi: number, worstDay: string | null, worstLevel: string | null) =>
      [
        [`Is the air quality in ${n} good today?`, `It's ${level.toLowerCase()} right now (European AQI ${r(aqi)}).`],
        [
          `Will air quality get worse in ${n}?`,
          worstDay && worstLevel
            ? `The worst day in the next four is ${worstDay}, forecast as ${worstLevel.toLowerCase()}.`
            : "No major change is expected over the next few days.",
        ],
      ] as Array<[string, string]>,
  },

  tables: {
    hour: "Hour",
    feels: "Feels",
    chance: "Chance",
    amount: "Amount",
    highLow: "High / low",
    change: "Change",
    pollutant: "Pollutant",
    value: "Value",
    level: "Level",
    month: "Month",
    avgHigh: "Avg. high",
    avgLow: "Avg. low",
    precip: "Precipitation",
    wetDays: "Rainy days",
    sunHours: "Sunshine",
    snowDays: "Snow days",
    perDay: "h/day",
    wetHint: "≥ 40% chance of precipitation",
  },

  views: {
    tomorrowStats: "Tomorrow at a glance",
    hourByHour: "Hour by hour",
    next48: "Next 48 hours",
    dailyTable: "Day-by-day forecast",
    pollutants: "Pollutants (µg/m³)",
    aqiForecast: "Air quality forecast",
    aqiScale: "What the index means",
    pollenNote: "Pollen is modelled for Europe only.",
    next30: "Next 30 days",
    moonTitle: "Moon phases",
    moonToday: "Today",
    illumination: "Illuminated",
    nextFull: "Next full moon",
    nextNew: "Next new moon",
    solstices: "Longest and shortest days",
    juneSolstice: "June solstice",
    decemberSolstice: "December solstice",
    sunNote: "Times are calculated for the city centre and may differ by a minute or two from local almanacs.",
    monthlyTable: "Monthly averages",
    climateChart: "Temperature and precipitation through the year",
    bestTime: "Best time to visit",
    byMonth: "Weather by month",
    monthStats: "Averages",
    whatToPack: "What to pack",
    otherMonths: "Other months",
    nearbyInMonth: (m: number) => `Nearby places in ${MONTHS[m]}`,
    daylightMid: "Daylight (mid-month)",
    recordHigh: "Record high",
    recordLow: "Record low",
    climateSource: (source: string, period: string) => `Climate normals for ${period} from ${source}.`,
    compareYear: "Compared with the rest of the year",
    rank: (rank: number) =>
      rank === 1 ? "the warmest month of the year" : rank === 12 ? "the coldest month of the year" : `the ${ordinal(rank)} warmest month of the year`,
  },

  widget: {
    title: "Free Weather Widget for Your Website",
    description:
      "Add a free, fast weather widget to your website or blog. Current conditions and a 4-day forecast for any of hundreds of cities, in English or Czech.",
    h1: "Free weather widget",
    lead: "Show live weather for your city on your website. No sign-up, no ads, no cookies — just copy one line of code.",
    city: "City",
    cityPlaceholder: "Pick a city…",
    theme: "Theme",
    themes: { light: "Light", dark: "Dark", auto: "Match visitor" },
    language: "Language",
    preview: "Preview",
    code: "Embed code",
    copy: "Copy code",
    copied: "Copied!",
    notes: [
      "The widget updates automatically every hour.",
      "It is 100% wide and 260 px tall — adjust the width to fit your layout.",
      "Please keep the WeatherNow credit link visible; it is what keeps the widget free.",
    ],
    /** Text before the credit link in the embed snippet. */
    credit: "Forecast by",
  },

  embed: {
    full: "Full forecast",
    by: "Weather by WeatherNow",
  },
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export type Dictionary = typeof en;
export default en;
