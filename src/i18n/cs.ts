import type {
  ClimateProse,
  DayBrief,
  Dictionary,
  MonthProse,
  OverviewProse,
  RangeProse,
  SunLine,
} from "./en";

/**
 * Czech dictionary. Place names come from GeoNames in the nominative, so the
 * sentences are built to avoid declining them ("Praha: …", "Počasí Praha").
 */

const r = (n: number) => Math.round(n);
const dec = (n: number) => n.toLocaleString("cs-CZ", { maximumFractionDigits: 1 });
const T = (c: number) => `${r(c)} °C`;
const pct = (p: number) => `${r(p * 100)} %`;
const mm = (v: number) => `${v < 10 ? dec(Math.round(v * 10) / 10) : r(v)} mm`;
const kmh = (ms: number) => `${r(ms * 3.6)} km/h`;

/** 1 den · 2–4 dny · 5+ dní */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4 && Number.isInteger(n)) return few;
  return many;
}
const days = (n: number) => `${n} ${plural(n, "den", "dny", "dní")}`;
/**
 * Locative "in n days": `v 1 dni`, `ve 3 dnech`, `v 5 dnech`. The preposition
 * follows how the number is read: ve dvou, třech, čtyřech, dvanácti, třinácti,
 * čtrnácti, dvaceti… (forecasts never need more than 16 days).
 */
const inDays = (n: number) =>
  `${[2, 3, 4, 12, 13, 14].includes(n) || (n >= 20 && n < 50) ? "ve" : "v"} ${n} ${n === 1 ? "dni" : "dnech"}`;
const sunSentence = (sun: SunLine) =>
  "rise" in sun
    ? `Slunce vychází v ${sun.rise} a zapadá v ${sun.set}.`
    : sun.polar === "day"
      ? "Slunce nezapadá (polární den)."
      : "Slunce nevychází (polární noc).";
const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} a ${items[items.length - 1]}`;

const MONTHS = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];
const IN_MONTH = [
  "v lednu",
  "v únoru",
  "v březnu",
  "v dubnu",
  "v květnu",
  "v červnu",
  "v červenci",
  "v srpnu",
  "v září",
  "v říjnu",
  "v listopadu",
  "v prosinci",
];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const cs: Dictionary = {
  meta: {
    siteName: "WeatherNow",
    description:
      "Přesná hodinová a 14denní předpověď počasí, kvalita ovzduší, východ a západ slunce a klimatické průměry pro města po celém světě. Rychle, zdarma a bez reklam.",
    ogAlt: "WeatherNow — aktuální počasí a předpověď",
  },

  nav: {
    main: "Hlavní navigace",
    home: "Počasí",
    countries: "Země",
    widget: "Widget",
    about: "O aplikaci",
    language: "Jazyk",
    switchTo: "English",
  },

  footer: {
    blurb:
      "Rychlé počasí bez reklam: aktuální stav, přehledné trendy a poctivá předpověď pro jakékoli místo na Zemi.",
    source: "Zdrojový kód na GitHubu",
    popular: "Oblíbené předpovědi",
    countries: "Země",
    allCountries: "Všechny země",
    project: "Projekt",
    about: "O aplikaci",
    privacy: "Ochrana soukromí",
    terms: "Podmínky použití",
    widget: "Widget s počasím zdarma",
    data: "Data o počasí:",
    climateData: "Klimatické normály:",
    placesData: "Místa:",
    copyright: (year: number) => `© ${year} WeatherNow, Robert Libsansky.`,
    disclaimer:
      "Předpovědi a hodnocení zde mají informativní charakter. Výstrahy a varování před nebezpečným počasím vždy sledujte u národní meteorologické služby (v Česku ČHMÚ).",
  },

  common: {
    loading: "Načítám data o počasí…",
    retry: "Zkusit znovu",
    dismiss: "Zavřít zprávu",
    now: "Teď",
    today: "Dnes",
    tomorrow: "Zítra",
    high: "Max.",
    low: "Min.",
    wind: "Vítr",
    gusts: "Nárazy",
    feelsLike: "Pocitově",
    humidity: "Vlhkost",
    precipitation: "Srážky",
    rainChance: "Šance srážek",
    uv: "UV index",
    sunrise: "Východ",
    sunset: "Západ",
    daylight: "Délka dne",
    sunshine: "Slunce",
    day: "Den",
    date: "Datum",
    conditions: "Počasí",
    temperature: "Teplota",
    localTime: "místního času",
    km: (n: number) => `${n} km`,
    updatedAgo: (rel: string) => `aktualizováno ${rel}`,
    justNow: "právě teď",
    minAgo: (n: number) => `před ${n} min`,
    hoursAgo: (n: number) => (n === 1 ? "před hodinou" : `před ${n} hodinami`),
    units: "Jednotky",
    theme: "Barevný motiv",
    themeLight: "Světlý motiv",
    themeDark: "Tmavý motiv",
    themeSystem: "Podle systému",
    breadcrumb: "Drobečková navigace",
    home: "Domů",
    world: "Počasí",
  },

  errors: {
    generic: "Při načítání počasí se něco pokazilo.",
    rateLimited: "Meteorologická služba je teď přetížená — zkuste to prosím za chvíli.",
    offline: "Zdá se, že jste offline. Zkontrolujte připojení a zkuste to znovu.",
    geoUnsupported: "Tento prohlížeč nepodporuje zjištění polohy.",
    geoFailed: "Polohu se nepodařilo zjistit. Zkuste místo toho vyhledat město.",
    notFoundTitle: "Stránka nenalezena",
    notFoundText: "Tuto stránku jsme nenašli. Zkuste vyhledat město.",
    backHome: "Zpět na předpověď",
    errorTitle: "Něco se pokazilo",
    errorText: "Tuto stránku se nepodařilo zobrazit. Zkuste to prosím za chvíli znovu.",
  },

  search: {
    aria: "Hledání počasí",
    label: "Vyhledejte město a zobrazte jeho počasí",
    placeholder: "Hledat město…",
    submit: "Hledat",
    locate: "Použít mou polohu",
    clear: "Vymazat hledání",
    suggestions: "Návrhy měst",
    popular: "Oblíbená místa",
    noMatch: "Zatím nic — pokračujte v psaní názvu.",
    searching: "Hledám…",
    yourLocation: "Vaše poloha",
  },

  favorites: {
    heading: "Vaše místa",
    save: "Uložit do mých míst",
    unsave: "Odebrat z mých míst",
    remove: (name: string) => `Odebrat ${name} z mých míst`,
    saved: (name: string) => `${name} uloženo do vašich míst`,
    removed: (name: string) => `${name} odebráno z vašich míst`,
    limit: (n: number) => `Uložit můžete nejvýše ${n} míst`,
  },

  current: {
    aria: "Aktuální počasí",
    share: "Sdílet předpověď",
    refresh: "Obnovit data",
    copied: "Odkaz zkopírován do schránky",
    copyFailed: "Odkaz se nepodařilo zkopírovat",
    shareText: (name: string, temp: string, cond: string) => `${name}: ${temp}, ${cond.toLowerCase()}`,
  },

  highlights: {
    aria: "Podrobnosti",
    dewPoint: (t: string, comfort: string) => `Rosný bod ${t} · ${comfort}`,
    dewComfort: ["Velmi sucho", "Příjemně", "Příjemně", "Mírně dusno", "Dusno", "Velmi dusno"],
    windLevels: [
      "Bezvětří",
      "Slabý vánek",
      "Mírný vítr",
      "Čerstvý vítr",
      "Silný vítr",
      "Vichřice",
      "Orkán",
    ],
    compass: [
      "S", "SSV", "SV", "VSV", "V", "VJV", "JV", "JJV",
      "J", "JJZ", "JZ", "ZJZ", "Z", "ZSZ", "SZ", "SSZ",
    ],
    pressure: "Tlak",
    trend: { rising: "Stoupá", falling: "Klesá", steady: "Stálý" },
    visibility: "Dohlednost",
    visibilityLevels: ["Velmi špatná", "Opar", "Dobrá", "Výborná"],
    clouds: "Oblačnost",
    cloudLevels: ["Jasná obloha", "Malá oblačnost", "Oblačno", "Zataženo"],
    uvLevels: ["Nízký", "Střední", "Vysoký", "Velmi vysoký", "Extrémní"],
    uvAdvice: [
      "Ochrana není potřeba",
      "Při delším pobytu opalovací krém",
      "Opalovací krém a pokrývka hlavy",
      "Vyhněte se polednímu slunci",
      "Zůstaňte ve stínu",
    ],
    afterDark: "Po setmění",
    belowHorizon: "Slunce je pod obzorem",
  },

  hourly: {
    title: "Příštích 24 hodin",
    subtitle: "Hodinu po hodině, v místním čase",
  },

  chart: {
    title: "Vývoj teploty",
    subtitle: "Najeďte na bod pro přesnou hodnotu",
    temperature: "Teplota",
    feelsLike: "Pocitová teplota",
    pop: "Pravděpodobnost srážek",
    feels: "pocitově",
    aria: (min: string, max: string, hours: number) =>
      `Vývoj teploty od ${min} do ${max} během příštích ${hours} hodin`,
  },

  daily: {
    title: "Den po dni",
    subtitle: (n: number) => `Příštích ${n} dní — klepněte na řádek pro podrobnosti`,
    maxWind: "Max. vítr",
    uvMax: "UV max.",
  },

  sun: {
    title: "Slunce a Měsíc",
    subtitle: (daylight: string) => `Den trvá ${daylight}`,
    next: (event: "sunrise" | "sunset") => (event === "sunset" ? "Západ za" : "Východ za"),
    moonPhases: [
      "Nov",
      "Dorůstající srpek",
      "První čtvrť",
      "Dorůstající Měsíc",
      "Úplněk",
      "Couvající Měsíc",
      "Poslední čtvrť",
      "Ubývající srpek",
    ],
    illuminated: (p: number) => `osvětleno ${p} %`,
    fullTonight: "úplněk dnes v noci",
    fullIn: (n: number) => `úplněk za ${days(n)}`,
    polar: {
      day: "Polární den — slunce dnes nezapadá",
      night: "Polární noc — slunce dnes nevychází",
    },
  },

  air: {
    title: "Kvalita ovzduší",
    subtitle: "Evropský index kvality ovzduší (EAQI)",
    levels: ["Dobrá", "Přijatelná", "Mírně zhoršená", "Špatná", "Velmi špatná", "Extrémně špatná"],
    advice: [
      "Ovzduší je čisté — užijte si pobyt venku.",
      "Kvalita ovzduší je pro většinu lidí přijatelná.",
      "Citliví lidé by měli omezit dlouhou námahu venku.",
      "Zvažte zkrácení náročné aktivity venku.",
      "Vyhněte se náročné aktivitě venku; citliví lidé by měli zůstat uvnitř.",
      "Pokud můžete, zůstaňte uvnitř a zavřete okna.",
    ],
    usAqi: "US AQI",
    pollen: "Pyl",
    pollenTypes: {
      alder: "Olše",
      birch: "Bříza",
      grass: "Trávy",
      mugwort: "Pelyněk",
      olive: "Olivovník",
      ragweed: "Ambrozie",
    },
    pollenLevels: ["Žádný", "Nízký", "Střední", "Vysoký", "Velmi vysoký"],
    unavailable: "Data o kvalitě ovzduší pro toto místo teď nejsou k dispozici.",
  },

  insights: {
    title: "Co to znamená",
    subtitle: "Shrnutí lidskou řečí",
    feelsTitle: (t: string) => `Pocitově ${t}`,
    wear: {
      arctic: "Teplá bunda, čepice a rukavice — venku to kouše.",
      winter: "Zimní kabát a šála vás udrží v teple.",
      jacket: "Bunda nebo teplá vrstva bude správná volba.",
      layers: "Stačí dlouhý rukáv nebo lehká vrstva.",
      light: "Počasí na tričko — oblečte se nalehko.",
      hot: "Volné, lehké oblečení a hodně pití.",
    },
    umbrellaTitle: "Vezměte si deštník",
    umbrellaText: (p: number, at: string) =>
      `Pravděpodobnost srážek ${r(p * 100)} % kolem ${at}.`,
    dryTitle: "Bez deště",
    dryText: "Během příštích 12 hodin se nečekají žádné významné srážky.",
    windTitle: "Větrno",
    windText: (speed: string) => `Nárazy až ${speed} — zajistěte volné předměty venku.`,
    iceTitle: "Pozor na náledí",
    iceText: "Teploty kolem nuly a vysoká vlhkost — povrchy mohou klouzat.",
    bestTitle: (at: string) => `Nejlepší chvíle: ${at}`,
    bestText: (t: string, p: number) =>
      `${t} a ${r(p * 100)} % šance na srážky — to nejlepší z příštího dne.`,
    swingTitle: "Velký teplotní rozdíl",
    swingText: (delta: string) =>
      `Mezi maximem a minimem za příštích 24 hodin je asi ${delta} — oblečte se do vrstev.`,
    dryAirTitle: "Velmi suchý vzduch",
    dryAirText: (h: number) => `Vlhkost je jen ${h} % — mějte po ruce vodu.`,
    muggyTitle: "Dusno",
    muggyText: (h: number) => `Vlhkost ${h} % — bude se zdát tepleji, než ukazuje teploměr.`,
    uvTitle: "Silné slunce",
    uvText: (uv: number) => `UV index dnes dosáhne ${r(uv)} — opalovací krém a sluneční brýle.`,
  },

  activities: {
    title: "Dobrý den na…",
    winner: (label: string, emoji: string) => `Dnešní vítěz: ${label.toLowerCase()} ${emoji}`,
    labels: {
      running: "Běh",
      cycling: "Kolo",
      terrace: "Zahrádka",
      laundry: "Sušení prádla",
      stargazing: "Hvězdy",
      photo: "Focení",
    },
    verdicts: ["Zapomeňte", "Slabé", "Ujde to", "Dobré", "Výborné"],
    note: "Hodnocení kombinuje teplotu, vítr, oblačnost a šanci srážek. Pro zábavu — řiďte se vlastním úsudkem.",
  },

  dashboard: {
    footnote: "Data z Open-Meteo · automatická aktualizace každých 10 minut · stiskněte",
    footnoteKey: "pro hledání",
  },

  wmo: {
    0: "Jasno",
    1: "Skoro jasno",
    2: "Polojasno",
    3: "Zataženo",
    45: "Mlha",
    48: "Mlha s námrazou",
    51: "Slabé mrholení",
    53: "Mrholení",
    55: "Silné mrholení",
    56: "Slabé mrznoucí mrholení",
    57: "Mrznoucí mrholení",
    61: "Slabý déšť",
    63: "Déšť",
    65: "Silný déšť",
    66: "Slabý mrznoucí déšť",
    67: "Mrznoucí déšť",
    71: "Slabé sněžení",
    73: "Sněžení",
    75: "Silné sněžení",
    77: "Sněhová zrna",
    80: "Slabé přeháňky",
    81: "Přeháňky",
    82: "Silné přeháňky",
    85: "Sněhové přeháňky",
    86: "Silné sněhové přeháňky",
    95: "Bouřka",
    96: "Bouřka s kroupami",
    99: "Silná bouřka s kroupami",
  },

  continents: {
    EU: "Evropa",
    AS: "Asie",
    NA: "Severní Amerika",
    SA: "Jižní Amerika",
    AF: "Afrika",
    OC: "Oceánie",
  },

  months: MONTHS,
  inMonth: (m: number) => IN_MONTH[m],

  home: {
    title: "WeatherNow — Počasí a předpověď pro každé město, po hodinách i na 14 dní",
    description:
      "Předpověď počasí zdarma a bez reklam pro jakékoli město na světě: aktuální stav, hodinová a 14denní předpověď, kvalita ovzduší, východ slunce a klimatické průměry.",
    h1: "Předpověď počasí pro každé město",
    lead: "Aktuální stav, vývoj po hodinách, výhled na 14 dní, kvalita ovzduší a klimatické průměry — pro jakékoli místo na Zemi.",
    yourWeather: "Vaše počasí",
    locating: "Zjišťuji vaši polohu…",
    openFull: (name: string) => `Celá předpověď: ${name}`,
    emptyTitle: "Najděme vaše počasí",
    emptyText:
      "Vyhledejte jakékoli město nebo sdílejte polohu a uvidíte aktuální stav, hodinový vývoj, kvalitu ovzduší a výhled na 14 dní.",
    popular: "Počasí v oblíbených městech",
    popularSub: "Aktuální teploty, aktualizováno každou hodinu",
    browse: "Předpověď podle zemí",
    allCountries: "Všechny země",
    whyTitle: "Proč WeatherNow",
    why: [
      ["Od hodin po 14 dní", "Podrobná data hodinu po hodině na dva dny a denní výhled na dva týdny."],
      ["Lidskou řečí", "Co si obléct, kdy bude pršet a kdy je nejlepší vyrazit ven — ne jen čísla."],
      ["Klimatické průměry", "Teploty, srážky a slunce po měsících pro plánování cest dopředu."],
      ["Bez reklam a registrace", "Rychlé stránky bez reklamních trackerů a cookies; uložená místa zůstávají ve vašem prohlížeči."],
    ],
  },

  world: {
    title: "Počasí ve světě — předpověď podle zemí",
    description: (n: number) =>
      `Předpověď počasí pro ${n} měst v zemích celého světa: hodinová a 14denní předpověď, kvalita ovzduší a podnebí.`,
    h1: "Počasí ve světě",
    lead: (n: number, c: number) => `Předpovědi pro ${n} měst ve ${c} zemích. Vyberte zemi a zobrazte všechna její města.`,
    cities: (n: number) => `${n} ${plural(n, "město", "města", "měst")}`,
  },

  country: {
    title: (country: string) => `Počasí ${country} — aktuální teploty a předpověď`,
    description: (country: string, n: number, sample: string) =>
      n === 1
        ? `Aktuální počasí a předpověď – ${sample} (${country}). Hodinová a 14denní předpověď i podnebí.`
        : `Aktuální počasí a předpověď pro ${n} ${plural(n, "místo", "místa", "míst")} – ${country}, mimo jiné ${sample}. Hodinová a 14denní předpověď i podnebí.`,
    h1: (country: string) => `Počasí ${country}`,
    lead: (country: string, n: number) =>
      `Aktuální teploty a počasí – ${country}, ${n} ${plural(n, "místo", "místa", "míst")}. Vyberte místo a zobrazte hodinovou a 14denní předpověď.`,
    warmest: (name: string, t: number) => `Teď nejtepleji: ${name}, ${T(t)}.`,
    coldest: (name: string, t: number) => `Nejchladněji: ${name}, ${T(t)}.`,
  },

  city: {
    tabs: {
      overview: "Přehled",
      tomorrow: "Zítra",
      hourly: "Po hodinách",
      "14-day": "14 dní",
      "air-quality": "Ovzduší",
      "sunrise-sunset": "Východ a západ slunce",
      climate: "Podnebí",
    },
    tabsAria: "Pohledy na předpověď",
    meta: {
      overview: (n: string, c: string) => `Počasí ${n} — předpověď po hodinách a na 14 dní | ${c}`,
      tomorrow: (n: string, c: string) => `Počasí ${n} zítra — předpověď po hodinách | ${c}`,
      hourly: (n: string, c: string) => `Počasí ${n} po hodinách — příštích 48 hodin | ${c}`,
      "14-day": (n: string, c: string) => `Počasí ${n} na 14 dní — dlouhodobá předpověď | ${c}`,
      "air-quality": (n: string, c: string) => `Kvalita ovzduší ${n} (${c}) — index a pyl dnes`,
      "sunrise-sunset": (n: string, c: string) => `Východ a západ slunce ${n} (${c}) — časy na 30 dní`,
      climate: (n: string, c: string) => `Podnebí ${n} — počasí podle měsíců a kdy jet | ${c}`,
      month: (n: string, c: string, m: number) => `Počasí ${n} ${IN_MONTH[m]} — teploty, srážky, slunce | ${c}`,
    },
    desc: {
      overview: (n: string) =>
        `Počasí ${n}: aktuální stav, předpověď po hodinách, výhled na 14 dní, kvalita ovzduší, východ a západ slunce.`,
      tomorrow: (n: string) =>
        `Počasí ${n} zítra: teplota po hodinách, šance srážek, vítr a UV index, k tomu východ a západ slunce.`,
      hourly: (n: string) =>
        `Hodinová předpověď počasí ${n}: teplota, pocitová teplota, srážky a vítr na příštích 48 hodin.`,
      "14-day": (n: string) =>
        `Předpověď počasí ${n} na 14 dní: denní maxima a minima, srážky, vítr a UV na dva týdny dopředu.`,
      "air-quality": (n: string) =>
        `Aktuální kvalita ovzduší ${n}: evropský i americký index, PM2,5, PM10, ozon, NO₂ a pyl, výhled na 4 dny.`,
      "sunrise-sunset": (n: string) =>
        `Východ a západ slunce ${n} a délka dne na příštích 30 dní, fáze Měsíce a slunovraty.`,
      climate: (n: string, p: ClimateProse) =>
        `Podnebí ${n}: průměrné teploty, srážky a slunce po měsících. Nejtepleji ${IN_MONTH[p.warmest]}, nejlepší doba pro návštěvu: ${list(p.best.map((m) => MONTHS[m]))}.`,
      month: (n: string, m: number, hi: number, lo: number, p: number) =>
        `Jaké je počasí ${n} ${IN_MONTH[m]}? Průměrné maximum ${r(hi)} °C, minimum ${r(lo)} °C, srážky ${mm(p)}. A co si sbalit.`,
    },
    h1: {
      overview: (n: string) => `Počasí ${n}`,
      tomorrow: (n: string) => `Počasí ${n} zítra`,
      hourly: (n: string) => `Počasí ${n} po hodinách`,
      "14-day": (n: string) => `Počasí ${n} na 14 dní`,
      "air-quality": (n: string) => `Kvalita ovzduší ${n}`,
      "sunrise-sunset": (n: string) => `Východ a západ slunce ${n}`,
      climate: (n: string) => `Podnebí ${n}: počasí podle měsíců`,
      month: (n: string, m: number) => `Počasí ${n} ${IN_MONTH[m]}`,
    },
    faqTitle: "Časté otázky",
    nearby: "Počasí v okolí",
    moreIn: (country: string) => `Všechna místa – ${country}`,
    climateTeaser: "Podnebí v kostce",
    climateLink: (n: string) => `Celý přehled podnebí: ${n}`,
    dataUnavailable:
      "Aktuální předpověď se na serveru teď nepodařilo načíst — za okamžik se načte ve vašem prohlížeči.",
    viewUnavailable: "Data pro tento pohled teď nejsou k dispozici. Zkuste to prosím za pár minut.",
    elevation: (m: number) => `Nadmořská výška ${r(m)} m`,
    embedCta: "Vložte si tuto předpověď na svůj web",
  },

  prose: {
    overview: (p: OverviewProse) => {
      const parts = [`${p.name} teď (${p.time} místního času): ${T(p.temp)}, ${p.cond.toLowerCase()}, pocitově ${T(p.feels)}.`];
      if (p.today)
        parts.push(
          `Dnes nejvýše ${T(p.today.hi)}, nejníže ${T(p.today.lo)}${p.today.pop !== null ? `, pravděpodobnost srážek ${pct(p.today.pop)}` : ""}.`
        );
      if (p.rainPop >= 0.4 && p.rainAt)
        parts.push(`Největší šance na déšť během příštích 24 hodin je kolem ${p.rainAt}.`);
      if (p.tomorrow)
        parts.push(`Zítra: ${p.tomorrow.cond.toLowerCase()}, ${T(p.tomorrow.hi)} / ${T(p.tomorrow.lo)}.`);
      if (p.week)
        parts.push(
          `Během příštích ${p.week.days} dní se maxima pohybují mezi ${r(p.week.hiMin)} a ${r(p.week.hiMax)} °C; ${p.week.wetDays === 0 ? "srážky se nečekají" : `srážky se čekají ${inDays(p.week.wetDays)}`}. Nejtepleji: ${p.week.warmestLabel.replace(/\.$/, "")}.`
        );
      return parts.join(" ");
    },
    tomorrow: (n: string, d: DayBrief, sun: SunLine) =>
      `${n} zítra (${d.label}): ${d.cond.toLowerCase()}, nejvýše ${T(d.hi)}, nejníže ${T(d.lo)}. ` +
      (d.pop !== null ? `Pravděpodobnost srážek ${pct(d.pop)}${d.precip >= 0.2 ? `, celkem asi ${mm(d.precip)}` : ""}. ` : "") +
      `Vítr až ${kmh(d.windMax)}${d.uvMax !== null ? `, UV index až ${r(d.uvMax)}` : ""}. ${sunSentence(sun)}`,
    hourly: (n: string, hours: number, min: number, max: number, wetHours: number) =>
      `${n}: během příštích ${hours} hodin se teplota pohybuje mezi ${T(min)} a ${T(max)}. ` +
      (wetHours === 0
        ? "Žádná hodina nemá významnou šanci na srážky."
        : `${wetHours} ${plural(wetHours, "hodina má", "hodiny mají", "hodin má")} pravděpodobnost srážek 40 % a více — jsou v tabulce zvýrazněné.`),
    range: (p: RangeProse) =>
      `${p.name} – výhled na ${days(p.days)}: denní maxima mezi ${T(p.hiMin)} a ${T(p.hiMax)}. ` +
      `Nejtepleji: ${p.warmestLabel} (${T(p.warmestHi)}), nejchladnější noc: ${p.coldestLabel} (${T(p.coldestLo)}). ` +
      (p.wetDays === 0
        ? "Žádný den by neměl přinést 1 mm srážek a více. "
        : `Srážky 1 mm a více se čekají ${inDays(p.wetDays)}, nejvíce: ${p.wettestLabel} (${mm(p.wettestPrecip)}). `) +
      (Math.abs(p.trend) < 2
        ? "Teploty zůstanou po celé období zhruba stejné."
        : p.trend > 0
          ? `Ke konci období se oteplí zhruba o ${r(p.trend)} °C.`
          : `Ke konci období se ochladí zhruba o ${r(-p.trend)} °C.`),
    rangeNote:
      "Předpověď na více než 7 dní ukazuje hlavně trend; jednotlivé dny se ještě mohou změnit, proto se podívejte znovu blíž k datu.",
    air: (n: string, aqi: number, level: string, advice: string, us: number | null) =>
      `${n}: kvalita ovzduší je teď ${level.toLowerCase()}, evropský index ${r(aqi)}${us !== null ? ` (americký AQI ${r(us)})` : ""}. ${advice}`,
    sun: (n: string, sunrise: string, sunset: string, daylight: string, change: number | null) =>
      `${n} dnes: slunce vychází v ${sunrise} a zapadá v ${sunset}, den trvá ${daylight}.` +
      (change === null || Math.abs(change) < 1
        ? ""
        : change > 0
          ? ` Dny se prodlužují zhruba o ${r(change)} min denně.`
          : ` Dny se zkracují zhruba o ${r(-change)} min denně.`),
    polarDay: "Slunce dnes nezapadá (polární den).",
    polarNight: "Slunce dnes nevychází (polární noc).",
    climate: (p: ClimateProse) =>
      `${p.name}: nejtepleji je ${IN_MONTH[p.warmest]}, kdy průměrná maxima dosahují ${T(p.warmestHi)}, nejchladněji ${IN_MONTH[p.coldest]} s průměrnými minimy ${T(p.coldestLo)}. ` +
      `Nejvíce srážek spadne ${IN_MONTH[p.wettest]} (${mm(p.wettestP)}), nejméně ${IN_MONTH[p.driest]} (${mm(p.driestP)}); za běžný rok spadne asi ${r(p.annualPrecip)} mm. ` +
      (p.sunniest !== null ? `Nejvíce slunce bývá ${IN_MONTH[p.sunniest]}. ` : "") +
      (p.frostMonths > 0
        ? `Průměrné noční teploty klesají pod nulu ${p.frostMonths} ${plural(p.frostMonths, "měsíc", "měsíce", "měsíců")} v roce. `
        : "Průměrná minima zůstávají celý rok nad nulou. ") +
      `Nejpříjemnější počasí pro návštěvu: ${list(p.best.map((m) => MONTHS[m]))}.`,
    month: (p: MonthProse) =>
      `${p.name} ${IN_MONTH[p.month]}: průměrná denní maxima ${T(p.hi)}, noční minima ${T(p.lo)}` +
      `${Math.abs(p.hi - p.prevHi) >= 1 ? ` — o ${r(Math.abs(p.hi - p.prevHi))} °C ${p.hi > p.prevHi ? "tepleji" : "chladněji"} než ${IN_MONTH[p.prevMonth]}` : ""}. ` +
      `Spadne asi ${mm(p.p)} srážek${p.pd === undefined ? "" : p.pd < 0.5 ? ", deštivé dny jsou vzácné" : `; dní se srážkami alespoň 1 mm bývá zhruba ${r(p.pd)}`}` +
      `${p.sd !== undefined && p.sd >= 0.5 ? `; sněží asi ${days(r(p.sd))}` : ""}. ` +
      `${p.sun !== undefined ? `Slunce svítí přibližně ${r(p.sun)} ${plural(r(p.sun), "hodinu", "hodiny", "hodin")} denně a den` : "Den"} trvá v polovině měsíce ${p.daylight}. ` +
      `${p.rhi !== undefined && p.rlo !== undefined ? `Extrémy posledních desetiletí: od ${T(p.rlo)} do ${T(p.rhi)}.` : ""}`,
    verdicts: {
      great: (n: string, m: number) => `${cap(MONTHS[m])} patří k nejlepším měsícům pro návštěvu (${n}) — příjemné počasí na procházky i výlety.`,
      good: (n: string, m: number) => `${cap(MONTHS[m])} je dobrá doba pro návštěvu (${n}); počasí je většinou příjemné.`,
      // "doba" místo přídavného jména: shoda by jinak neseděla u "září" (střední rod).
      fair: (n: string, m: number) => `${cap(MONTHS[m])} je pro návštěvu (${n}) spíše průměrná doba — počítejte s proměnlivým počasím.`,
      poor: (n: string, m: number) => `${cap(MONTHS[m])} není nejpříjemnější měsíc (${n}), zato bývá méně turistů; oblečte se podle počasí.`,
    },
    pack: {
      arctic: "Sbalte si teplou zimní bundu, termoprádlo, čepici, rukavice a nepromokavé boty.",
      winter: "Sbalte si teplý kabát, šálu a vrstvy; hodí se i nepromokavé boty.",
      jacket: "Sbalte si bundu, teplý svetr a deštník.",
      layers: "Sbalte si lehké vrstvy a slabší bundu na večer.",
      light: "Sbalte si lehké oblečení, sluneční brýle a něco na večer.",
      hot: "Sbalte si prodyšné oblečení, opalovací krém, pokrývku hlavy a láhev na vodu.",
    },
  },

  faq: {
    overview: (p: OverviewProse) => {
      const items: Array<[string, string]> = [
        [
          `${p.name}: jaké je teď počasí?`,
          `V ${p.time} místního času je ${T(p.temp)}, ${p.cond.toLowerCase()}, pocitově ${T(p.feels)}.`,
        ],
      ];
      if (p.today)
        items.push([
          `${p.name}: bude dnes pršet?`,
          p.today.pop === null
            ? `Dnes se čeká asi ${mm(p.today.precip)} srážek.`
            : p.today.pop < 0.2
              ? `Déšť je dnes nepravděpodobný — pravděpodobnost srážek je ${pct(p.today.pop)}.`
              : `Pravděpodobnost srážek je dnes ${pct(p.today.pop)}${p.today.precip >= 0.2 ? `, čeká se asi ${mm(p.today.precip)}` : ""}.`,
        ]);
      if (p.tomorrow)
        items.push([
          `${p.name}: jaké bude počasí zítra?`,
          `Zítra ${p.tomorrow.cond.toLowerCase()}, nejvýše ${T(p.tomorrow.hi)}, nejníže ${T(p.tomorrow.lo)}${p.tomorrow.pop !== null ? `, pravděpodobnost srážek ${pct(p.tomorrow.pop)}` : ""}.`,
        ]);
      if (p.week)
        items.push([
          `${p.name}: jaká je předpověď na tento týden?`,
          `Maxima během příštích ${p.week.days} dní mezi ${r(p.week.hiMin)} a ${r(p.week.hiMax)} °C. Nejtepleji: ${p.week.warmestLabel} (${T(p.week.warmestHi)}); ${p.week.wetDays === 0 ? "žádný den by neměl být deštivý" : `srážky mohou přijít ${inDays(p.week.wetDays)}`}.`,
        ]);
      if (p.sunrise && p.sunset)
        items.push([
          `${p.name}: kdy dnes vychází a zapadá slunce?`,
          `Slunce vychází v ${p.sunrise} a zapadá v ${p.sunset} místního času.`,
        ]);
      else if (p.polar)
        items.push([
          `${p.name}: kdy dnes vychází a zapadá slunce?`,
          p.polar === "day"
            ? "Slunce dnes vůbec nezapadá — je polární den a světlo trvá 24 hodin."
            : "Slunce dnes vůbec nevychází — je polární noc.",
        ]);
      return items;
    },
    range: (p: RangeProse): Array<[string, string]> => [
      [
        `${p.name}: bude během příštích ${p.days} dní pršet?`,
        p.wetDays === 0
          ? "Žádný den by neměl přinést 1 mm srážek a více."
          : `Srážky 1 mm a více se čekají ${inDays(p.wetDays)}, nejvíce: ${p.wettestLabel} (${mm(p.wettestPrecip)}).`,
      ],
      [`${p.name}: který den bude nejtepleji?`, `Nejtepleji: ${p.warmestLabel}, maximum ${T(p.warmestHi)}.`],
      [`${p.name}: jak chladné budou noci?`, `Nejchladnější noc: ${p.coldestLabel}, minimum ${T(p.coldestLo)}.`],
      [
        `${p.name}: jak spolehlivá je předpověď na ${days(p.days)}?`,
        "Nejspolehlivější jsou nejbližší dny. Zhruba po týdnu předpověď ukazuje hlavně trend a jednotlivé dny se ještě mohou změnit, proto se podívejte znovu blíž k datu.",
      ],
    ],
    climate: (p: ClimateProse) => [
      [`${p.name}: který měsíc je nejteplejší?`, `Nejteplejší je ${MONTHS[p.warmest]}, průměrná maxima ${T(p.warmestHi)}.`],
      [`${p.name}: který měsíc je nejchladnější?`, `Nejchladnější je ${MONTHS[p.coldest]}, průměrná minima ${T(p.coldestLo)}.`],
      [`${p.name}: kdy nejvíc prší?`, `Nejvíce srážek spadne ${IN_MONTH[p.wettest]}, v průměru asi ${mm(p.wettestP)}.`],
      [`${p.name}: kdy je nejlepší doba k návštěvě?`, `Pro příjemné teploty a méně deště: ${list(p.best.map((m) => MONTHS[m]))}.`],
    ],
    month: (p: MonthProse, verdictText: string, packText: string) => {
      const items: Array<[string, string]> = [
        [`${p.name}: jak teplo je ${IN_MONTH[p.month]}?`, `Průměrná maxima jsou ${T(p.hi)}, minima ${T(p.lo)}.`],
        [
          `${p.name}: hodně prší ${IN_MONTH[p.month]}?`,
          `V průměru spadne asi ${mm(p.p)} srážek${p.pd === undefined ? "" : p.pd < 0.5 ? "; deštivé dny jsou vzácné" : `; dní se srážkami bývá zhruba ${r(p.pd)}`}.`,
        ],
      ];
      if (p.sd !== undefined || p.lo < 2)
        items.push([
          `${p.name}: sněží ${IN_MONTH[p.month]}?`,
          p.sd !== undefined
            ? p.sd >= 0.5
              ? `Ano — v běžném roce sněží asi ${days(r(p.sd))}.`
              : "Sníh je v tomto měsíci vzácný."
            : "V nejchladnějších dnech může sněžit.",
        ]);
      items.push([`${p.name}: je ${MONTHS[p.month]} dobrá doba k návštěvě?`, verdictText]);
      items.push([`${p.name}: co si sbalit ${IN_MONTH[p.month]}?`, packText]);
      return items;
    },
    air: (n: string, level: string, aqi: number, worstDay: string | null, worstLevel: string | null) => [
      [`${n}: je dnes ovzduší v pořádku?`, `Kvalita ovzduší je teď ${level.toLowerCase()} (evropský index ${r(aqi)}).`],
      [
        `${n}: zhorší se kvalita ovzduší?`,
        worstDay && worstLevel
          ? `Nejhorší ze čtyř příštích dní bude ${worstDay}, s předpovědí „${worstLevel.toLowerCase()}“.`
          : "Během příštích dní se nečeká výrazná změna.",
      ],
    ],
  },

  tables: {
    hour: "Hodina",
    feels: "Pocitově",
    chance: "Šance",
    amount: "Úhrn",
    highLow: "Max. / min.",
    change: "Změna",
    pollutant: "Látka",
    value: "Hodnota",
    level: "Úroveň",
    month: "Měsíc",
    avgHigh: "Prům. max.",
    avgLow: "Prům. min.",
    precip: "Srážky",
    wetDays: "Deštivé dny",
    sunHours: "Slunce",
    snowDays: "Dny se sněhem",
    perDay: "h/den",
    wetHint: "pravděpodobnost srážek ≥ 40 %",
  },

  views: {
    tomorrowStats: "Zítra v kostce",
    hourByHour: "Hodinu po hodině",
    next48: "Příštích 48 hodin",
    dailyTable: "Předpověď po dnech",
    pollutants: "Znečišťující látky (µg/m³)",
    aqiForecast: "Předpověď kvality ovzduší",
    aqiScale: "Co index znamená",
    pollenNote: "Pyl je modelován pouze pro Evropu.",
    next30: "Příštích 30 dní",
    moonTitle: "Fáze Měsíce",
    moonToday: "Dnes",
    illumination: "Osvětlení",
    nextFull: "Příští úplněk",
    nextNew: "Příští nov",
    solstices: "Nejdelší a nejkratší den",
    // Na jižní polokouli je červnový slunovrat zimní.
    solstice: (june: boolean, southern: boolean) => (june !== southern ? "Letní slunovrat" : "Zimní slunovrat"),
    sunNote: "Časy jsou spočítané pro střed města a od místních kalendářů se mohou lišit o minutu či dvě.",
    monthlyTable: "Měsíční průměry",
    climateChart: "Teploty a srážky během roku",
    bestTime: "Kdy jet",
    monthStats: "Průměry",
    whatToPack: "Co si sbalit",
    otherMonths: "Další měsíce",
    nearbyInMonth: (m: number) => `Okolní místa ${IN_MONTH[m]}`,
    daylightMid: "Délka dne (polovina měsíce)",
    recordHigh: "Rekordní maximum",
    recordLow: "Rekordní minimum",
    climateSource: (source: string, period: string) => `Klimatické normály za období ${period}, zdroj: ${source}.`,
    climatePart: { temperature: "teploty", precipitation: "srážky" },
    compareYear: "Ve srovnání se zbytkem roku",
    rank: (rank: number) =>
      rank === 1 ? "nejteplejší měsíc roku" : rank === 12 ? "nejchladnější měsíc roku" : `${rank}. nejteplejší měsíc roku`,
  },

  widget: {
    title: "Widget s počasím zdarma pro váš web",
    description:
      "Vložte si na web nebo blog rychlý widget s počasím zdarma. Aktuální stav a předpověď na 4 dny pro stovky měst, česky i anglicky.",
    h1: "Widget s počasím zdarma",
    lead: "Zobrazte aktuální počasí pro své město na svém webu. Bez registrace, bez reklam, bez cookies — stačí zkopírovat jeden řádek kódu.",
    city: "Město",
    cityPlaceholder: "Vyberte město…",
    theme: "Vzhled",
    themes: { light: "Světlý", dark: "Tmavý", auto: "Podle návštěvníka" },
    language: "Jazyk",
    preview: "Náhled",
    code: "Kód pro vložení",
    copy: "Zkopírovat kód",
    copied: "Zkopírováno!",
    notes: [
      "Widget se automaticky aktualizuje každou hodinu.",
      "Má šířku 100 % a výšku 260 px — šířku upravte podle svého webu.",
      "Ponechte prosím viditelný odkaz na WeatherNow; díky němu může widget zůstat zdarma.",
    ],
    credit: "Předpověď:",
  },

  embed: {
    full: "Celá předpověď",
    by: "Počasí od WeatherNow",
  },
};

export default cs;
