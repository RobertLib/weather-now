#!/usr/bin/env node
/**
 * Builds src/data/places.json and src/data/countries.json.
 *
 * Input: the curated city list in scripts/seed-cities.json plus the EXTRA list below
 * (Czech and Slovak towns, mountain resorts and holiday destinations).
 * Each place is resolved against the Open-Meteo geocoding API (GeoNames data)
 * in English and Czech; places that do not resolve to a populated place keep
 * their input coordinates and get timezone/elevation from the forecast API.
 *
 * Usage:
 *   DATA_CACHE_DIR=/path/to/cache node scripts/build-places.mjs
 *
 * Every HTTP response is cached in DATA_CACHE_DIR (default: <tmp>/weather-now-data-cache),
 * so re-runs are offline and an interrupted run resumes where it stopped.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assignCountrySlugs, assignPlaceSlugs, slugify } from "./lib/slugs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.resolve(
  process.env.DATA_CACHE_DIR ?? path.join(os.tmpdir(), "weather-now-data-cache")
);
const OUT_DIR = path.join(ROOT, "src", "data");

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
/** Open-Meteo free tier: 600 calls/min. Stay far below it. */
const MIN_INTERVAL_MS = 250;
/** Max distance between input coordinates and a geocoder hit. */
const MATCH_RADIUS_KM = 50;

/* -------------------------------------------------------------------------- */
/* Additional places                                                          */
/* -------------------------------------------------------------------------- */

/**
 * [en, cc, options?]
 * options.id  – force a GeoNames id (skips the search)
 * options.q   – geocoder query when it differs from the display name
 * options.cs  – Czech display name override
 * options.lat/lon – disambiguating coordinates (closest hit wins)
 */
const EXTRA = [
  // Czech towns (population ≳ 15,000)
  ...[
    "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové",
    "Pardubice", "Ústí nad Labem", "Zlín", "Havířov", "Kladno", "Most", "Opava",
    "Jihlava", "Frýdek-Místek", "Teplice", "Děčín", "Chomutov",
    "Karlovy Vary", "Jablonec nad Nisou", "Mladá Boleslav", "Prostějov",
    "Přerov", "Česká Lípa", "Třebíč", "Třinec", "Tábor", "Znojmo", "Kolín",
    "Příbram", "Cheb", "Písek", "Trutnov", "Kroměříž", "Orlová", "Vsetín",
    "Šumperk", "Uherské Hradiště", "Břeclav", "Hodonín", "Český Těšín",
    "Litvínov", "Havlíčkův Brod", "Nový Jičín", "Chrudim", "Krnov",
    "Litoměřice", "Sokolov", "Strakonice", "Valašské Meziříčí", "Klatovy",
    "Kopřivnice", "Jindřichův Hradec", "Žďár nad Sázavou", "Bohumín", "Vyškov",
    "Blansko", "Náchod", "Kutná Hora", "Beroun", "Mělník",
    "Brandýs nad Labem-Stará Boleslav", "Jirkov", "Žatec",
    "Kralupy nad Vltavou", "Louny", "Kadaň", "Hranice", "Otrokovice",
    "Benešov", "Svitavy", "Uherský Brod", "Říčany", "Rožnov pod Radhoštěm",
    "Jičín", "Slaný", "Ostrov", "Pelhřimov", "Neratovice",
    "Dvůr Králové nad Labem", "Rakovník", "Varnsdorf", "Bruntál",
    "Česká Třebová", "Bílina", "Nymburk",
  ].map((name) => [name, "CZ"]),
  // GeoNames files the town as "Fryštát" (PPLA2); "Karviná" is a pop-less PPLX.
  ["Karviná", "CZ", { id: 3073789 }],
  // Two "Komárno" records share the population; #3059435 has misplaced coordinates.
  ["Komárno", "SK", { id: 3059436 }],
  // Czech tourist spots
  ...[
    "Český Krumlov", "Mariánské Lázně", "Špindlerův Mlýn", "Harrachov",
    "Pec pod Sněžkou", "Lipno nad Vltavou", "Rokytnice nad Jizerou", "Telč",
    "Mikulov", "Lednice", "Karlštejn",
  ].map((name) => [name, "CZ"]),
  // Slovak towns (population ≳ 20,000)
  ...[
    "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava",
    "Trenčín", "Martin", "Poprad", "Prievidza", "Zvolen", "Považská Bystrica",
    "Michalovce", "Nové Zámky", "Spišská Nová Ves", "Levice",
    "Humenné", "Bardejov", "Liptovský Mikuláš", "Lučenec", "Piešťany",
    "Ružomberok", "Topoľčany", "Trebišov", "Čadca", "Dubnica nad Váhom",
    "Pezinok", "Rimavská Sobota", "Partizánske", "Vranov nad Topľou", "Šaľa",
    "Dunajská Streda", "Hlohovec", "Senec", "Brezno", "Senica",
    "Nové Mesto nad Váhom",
  ].map((name) => [name, "SK"]),
  // Slovak mountain resorts
  ["Štrbské Pleso", "SK"],
  ["Tatranská Lomnica", "SK"],
  ["Starý Smokovec", "SK"],
  ["Jasná", "SK", { q: "Demänovská Dolina", cs: "Jasná" }],
  // Holiday destinations
  ["Hurghada", "EG"],
  ["Sharm El Sheikh", "EG"],
  ["Marsa Alam", "EG"],
  ["Antalya", "TR"],
  ["Alanya", "TR"],
  ["Bodrum", "TR"],
  ["Heraklion", "GR"],
  ["Chania", "GR"],
  ["Rhodes", "GR"],
  ["Corfu", "GR"],
  ["Zakynthos", "GR"],
  ["Kos", "GR"],
  ["Split", "HR"],
  ["Dubrovnik", "HR"],
  ["Zadar", "HR"],
  ["Pula", "HR"],
  ["Makarska", "HR"],
  ["Poreč", "HR"],
  ["Rimini", "IT"],
  ["Lignano Sabbiadoro", "IT"],
  ["Bibione", "IT"],
  ["Jesolo", "IT"],
  ["Catania", "IT"],
  ["Palermo", "IT"],
  ["Cagliari", "IT"],
  ["Livigno", "IT"],
  ["Santa Cruz de Tenerife", "ES"],
  ["Las Palmas de Gran Canaria", "ES"],
  ["Arrecife", "ES"],
  ["Málaga", "ES"],
  ["Alicante", "ES"],
  ["Benidorm", "ES"],
  ["Ibiza", "ES", { lat: 38.9088, lon: 1.433 }], // not the Madrid neighbourhood
  ["Funchal", "PT"],
  ["Faro", "PT"],
  ["Larnaca", "CY"],
  ["Paphos", "CY"],
  ["Budva", "ME"],
  ["Burgas", "BG"],
  ["Varna", "BG"],
  ["Sunny Beach", "BG"],
  ["Hammamet", "TN"],
  ["Sousse", "TN"],
  ["Agadir", "MA"],
  ["Malé", "MV"],
  ["Zanzibar", "TZ"],
  ["Punta Cana", "DO"],
  ["Innsbruck", "AT"],
  ["Salzburg", "AT"],
  ["Kitzbühel", "AT"],
  ["Zell am See", "AT"],
  ["Schladming", "AT"],
  ["Linz", "AT"],
  ["Graz", "AT"],
  ["Chamonix", "FR", { q: "Chamonix-Mont-Blanc" }],
  ["Zermatt", "CH"],
  ["Garmisch-Partenkirchen", "DE"],
  ["Dresden", "DE"],
  ["Leipzig", "DE"],
  ["Nuremberg", "DE"],
  ["Passau", "DE"],
  ["Wrocław", "PL"],
  ["Katowice", "PL"],
  ["Gdańsk", "PL"],
  ["Zakopane", "PL"],
];

/** Extra geocoder queries for curated names GeoNames does not know. */
const QUERY_ALIASES = {
  "CA:Quebec City": ["Québec"],
};

/**
 * Hand fixes applied after geocoding, keyed by "CC:en".
 * Filled in after reviewing the generated names (see the run log).
 */
const OVERRIDES = {
  // Not populated places in GeoNames (island / state).
  "ID:Bali": { a1: { en: "Bali", cs: "Bali" } },
  "IN:Goa": { a1: { en: "Goa", cs: "Goa" } },
  // GeoNames has no (or a non-Czech) Czech name.
  "BG:Sofia": { cs: "Sofie" },
  "BG:Sunny Beach": { cs: "Slunečné pobřeží" },
  "AT:Salzburg": { cs: "Salcburk" },
  "CY:Larnaca": { cs: "Larnaka" },
  "CY:Paphos": { cs: "Pafos" },
  "CZ:Karviná": { cs: "Karviná" },
  "DE:Passau": { cs: "Pasov" },
  "FR:Chamonix": { cs: "Chamonix" },
  "GR:Chania": { cs: "Chania" },
  "GR:Corfu": { cs: "Korfu" },
  "GR:Heraklion": { cs: "Heraklion" },
  "GR:Rhodes": { cs: "Rhodos" },
  "GT:Guatemala City": { cs: "Guatemala" },
  "HK:Hong Kong": { cs: "Hongkong" },
  "IN:Mumbai": { cs: "Bombaj" },
  "IT:Jesolo": { cs: "Jesolo" },
  "KR:Busan": { cs: "Pusan" },
  "KW:Kuwait City": { cs: "Kuvajt" },
  "MO:Macau": { cs: "Macao" },
  "MV:Malé": { cs: "Malé" },
  "PA:Panama City": { cs: "Panama" },
  "PH:Cebu": { cs: "Cebu" },
  "SE:Gothenburg": { cs: "Göteborg" },
  "SG:Singapore": { cs: "Singapur" },
};

/**
 * Admin1 (region) fixes, keyed by "CC|GeoNames English admin1" → [en, cs];
 * null keeps the generated value. GeoNames often has no Czech name for a
 * region and then returns a local form ("Shanghai Shi", "Misto Kyiv").
 */
// prettier-ignore
const A1_FIXES = {
  // Czechia: official region names
  "CZ|Prague": [null, "Hlavní město Praha"],
  "CZ|Central Bohemia": ["Central Bohemian Region", "Středočeský kraj"],
  "CZ|South Bohemian Region": [null, "Jihočeský kraj"],
  "CZ|Plzeň Region": [null, "Plzeňský kraj"],
  "CZ|Carlsbad Region": ["Karlovy Vary Region", "Karlovarský kraj"],
  "CZ|Ústí nad Labem Region": [null, "Ústecký kraj"],
  "CZ|Liberec Region": [null, "Liberecký kraj"],
  "CZ|Hradec Králové Region": [null, "Královéhradecký kraj"],
  "CZ|Pardubice Region": [null, "Pardubický kraj"],
  "CZ|Vysocina": ["Vysočina Region", "Kraj Vysočina"],
  "CZ|South Moravian": ["South Moravian Region", "Jihomoravský kraj"],
  "CZ|Olomouc Region": [null, "Olomoucký kraj"],
  "CZ|Zlín": ["Zlín Region", "Zlínský kraj"],
  "CZ|Moravian-Silesian Region": [null, "Moravskoslezský kraj"],
  "SK|Trenčín Region": [null, "Trenčínský kraj"],
  // Elsewhere
  "AE|Dubai": [null, "Dubaj"],
  "AR|Buenos Aires F.D.": ["Buenos Aires", "Buenos Aires"],
  "AR|Cordoba": ["Córdoba", null],
  "AU|Queensland": [null, "Queensland"],
  "AU|South Australia": [null, "Jižní Austrálie"],
  "AZ|Baku City": ["Baku", "Baku"],
  "BA|Federation of Bosnia and Herzegovina": [null, "Federace Bosny a Hercegoviny"],
  "BD|Dhaka Division": [null, "Dháka"],
  "BG|Sofia-Capital": ["Sofia City", "Sofie"],
  "BR|Estado de Bahia": ["Bahia", null],
  "CD|Kinshasa City": ["Kinshasa", "Kinshasa"],
  "CN|Beijing Municipality": [null, "Peking"],
  "CN|Shanghai Municipality": [null, "Šanghaj"],
  "CN|Guangdong": [null, "Kuang-tung"],
  "CN|Sichuan": [null, "S’-čchuan"],
  "CO|Bogota D.C.": ["Bogotá", "Bogotá"],
  "CO|Departamento de Bolívar": ["Bolívar", "Bolívar"],
  "CR|Provincia de San José": ["San José Province", "San José"],
  "CU|Havana": [null, "Havana"],
  "CY|Pafos": ["Paphos", "Pafos"],
  "DK|Capital Region": ["Capital Region of Denmark", "Hlavní region"],
  "DO|La Altagracia Province": [null, "La Altagracia"],
  "DO|Nacional": ["Distrito Nacional", "Distrito Nacional"],
  "DZ|Algiers Province": [null, "Alžír"],
  "EC|Pichincha": [null, "Pichincha"],
  "EG|Red Sea": [null, "Rudé moře"],
  "ES|Balearic Islands": [null, "Baleáry"],
  "ES|Basque Country": [null, "Baskicko"],
  "ES|Catalonia": [null, "Katalánsko"],
  "ET|Addis Ababa": [null, "Addis Abeba"],
  "FJ|Central": ["Central Division", "Central Division"],
  "FR|New Aquitaine": ["Nouvelle-Aquitaine", "Nová Akvitánie"],
  "FR|Île-de-France Region": ["Île-de-France", null],
  "GR|Attica": [null, "Attika"],
  "GR|Crete": [null, "Kréta"],
  "GR|Ionian Islands": [null, "Jónské ostrovy"],
  "GR|South Aegean": [null, "Jižní Egeis"],
  "GT|Guatemala": ["Guatemala Department", "Guatemala"],
  "HR|City of Zagreb": [null, "Záhřeb"],
  "HR|Dubrovnik-Neretva County": [null, "Dubrovnicko-neretvanská župa"],
  "HR|Istria County": [null, "Istrijská župa"],
  "HR|Split-Dalmatia County": [null, "Splitsko-dalmatská župa"],
  "HR|Zadar County": [null, "Zadarská župa"],
  "ID|Jakarta Special Capital Region": ["Jakarta", "Jakarta"],
  "IN|National Capital Territory of Delhi": ["Delhi", "Dillí"],
  "IS|Capital Region": [null, "Hlavní region"],
  "IT|Lombardy": [null, "Lombardie"],
  "IT|Sardinia": [null, "Sardinie"],
  "JO|Amman Governorate": [null, "Ammán"],
  "KH|Phnom Penh": [null, "Phnompenh"],
  "KR|Busan": [null, "Pusan"],
  "KR|Seoul": [null, "Soul"],
  "KW|Al Asimah": ["Capital Governorate", "Al-Asima"],
  "LA|Vientiane Prefecture": [null, "Vientiane"],
  "LB|Beirut": [null, "Bejrút"],
  "LK|Western Province": [null, "Západní provincie"],
  "LU|Luxembourg": [null, "Lucemburk"],
  "LV|Riga": [null, "Riga"],
  "MG|Analamanga Region": [null, "Analamanga"],
  "MK|Grad Skopje": ["Skopje", "Skopje"],
  "MN|Ulaanbaatar": [null, "Ulánbátar"],
  "MU|Port Louis District": [null, "Port Louis"],
  "MV|Kaafu Atoll": [null, "Atol Kaafu"],
  "NG|FCT": ["Federal Capital Territory", "Federální teritorium hlavního města"],
  "NG|Lagos": [null, "Lagos"],
  "NO|Oslo": [null, "Oslo"],
  "NP|Bagmati Province": [null, "Provincie Bagmati"],
  "PA|Provincia de Panamá": ["Panamá Province", "Panama"],
  "PE|Lima Province": [null, "Lima"],
  "PH|National Capital Region": ["Metro Manila", "Metro Manila"],
  "PT|Faro District": [null, "Faro"],
  "PT|Porto District": [null, "Porto"],
  "PY|Asuncion": ["Asunción", null],
  "QA|Baladiyat ad Dawhah": ["Doha", "Dauhá"],
  "RO|Bucharest": [null, "Bukurešť"],
  "RS|Central Serbia": [null, "Centrální Srbsko"],
  "RU|St. Petersburg": ["Saint Petersburg", "Petrohrad"],
  "SA|Mecca Region": [null, "Mekka"],
  "SA|Riyadh Region": [null, "Rijád"],
  "SE|Stockholm County": [null, "Stockholm"],
  "SI|Ljubljana": [null, "Lublaň"],
  "TN|Nabeul Governorate": [null, "Nabul"],
  "TN|Sousse Governorate": [null, "Súsa"],
  "TW|Taiwan": [null, "Tchaj-wan"],
  "TZ|Dar es Salaam Region": [null, "Dar es Salaam"],
  "TZ|Zanzibar Urban/West": [null, "Zanzibar"],
  "UA|Kyiv City": ["Kyiv", "Kyjev"],
  "UG|Central Region": [null, "Centrální region"],
  "UY|Montevideo Department": [null, "Montevideo"],
  "UZ|Tashkent": [null, "Taškent"],
  "VE|Distrito Federal": ["Capital District", "Distrito Capital"],
  "VN|Hanoi": [null, "Hanoj"],
  "VN|Ho Chi Minh City (HCMC)": ["Ho Chi Minh City", "Ho Či Minovo Město"],
};

/* -------------------------------------------------------------------------- */
/* Countries                                                                  */
/* -------------------------------------------------------------------------- */

const COUNTRY_NAME_FIXES = {
  BA: { en: "Bosnia and Herzegovina" },
  CD: { en: "DR Congo", cs: "DR Kongo" },
  CG: { en: "Congo", cs: "Kongo" },
  HK: { en: "Hong Kong", cs: "Hongkong" },
  MM: { en: "Myanmar", cs: "Myanmar" },
  MO: { en: "Macau", cs: "Macao" },
  PS: { en: "Palestine", cs: "Palestina" },
  TR: { en: "Turkey" },
};

// prettier-ignore
const CONTINENT = {
  // Europe (incl. Turkey, Cyprus, Russia)
  AD: "EU", AL: "EU", AT: "EU", BA: "EU", BE: "EU", BG: "EU", BY: "EU", CH: "EU",
  CY: "EU", CZ: "EU", DE: "EU", DK: "EU", EE: "EU", ES: "EU", FI: "EU", FR: "EU",
  GB: "EU", GR: "EU", HR: "EU", HU: "EU", IE: "EU", IS: "EU", IT: "EU", LI: "EU",
  LT: "EU", LU: "EU", LV: "EU", MC: "EU", MD: "EU", ME: "EU", MK: "EU", MT: "EU",
  NL: "EU", NO: "EU", PL: "EU", PT: "EU", RO: "EU", RS: "EU", RU: "EU", SE: "EU",
  SI: "EU", SK: "EU", SM: "EU", TR: "EU", UA: "EU", VA: "EU", XK: "EU",
  // Asia (incl. Middle East and the Caucasus)
  AE: "AS", AF: "AS", AM: "AS", AZ: "AS", BD: "AS", BH: "AS", BN: "AS", BT: "AS",
  CN: "AS", GE: "AS", HK: "AS", ID: "AS", IL: "AS", IN: "AS", IQ: "AS", IR: "AS",
  JO: "AS", JP: "AS", KG: "AS", KH: "AS", KP: "AS", KR: "AS", KW: "AS", KZ: "AS",
  LA: "AS", LB: "AS", LK: "AS", MM: "AS", MN: "AS", MO: "AS", MV: "AS", MY: "AS",
  NP: "AS", OM: "AS", PH: "AS", PK: "AS", PS: "AS", QA: "AS", SA: "AS", SG: "AS",
  SY: "AS", TH: "AS", TJ: "AS", TL: "AS", TM: "AS", TW: "AS", UZ: "AS", VN: "AS",
  YE: "AS",
  // Africa
  AO: "AF", BF: "AF", BJ: "AF", BW: "AF", CD: "AF", CG: "AF", CI: "AF", CM: "AF",
  CV: "AF", DZ: "AF", EG: "AF", ET: "AF", GA: "AF", GH: "AF", GM: "AF", GN: "AF",
  KE: "AF", MA: "AF", MG: "AF", ML: "AF", MU: "AF", MW: "AF", MZ: "AF", NA: "AF",
  NE: "AF", NG: "AF", RE: "AF", RW: "AF", SC: "AF", SD: "AF", SN: "AF", SO: "AF",
  TN: "AF", TZ: "AF", UG: "AF", ZA: "AF", ZM: "AF", ZW: "AF",
  // North America (incl. Central America and the Caribbean)
  AG: "NA", BB: "NA", BS: "NA", BZ: "NA", CA: "NA", CR: "NA", CU: "NA", DO: "NA",
  GT: "NA", HN: "NA", HT: "NA", JM: "NA", MX: "NA", NI: "NA", PA: "NA", PR: "NA",
  SV: "NA", TT: "NA", US: "NA",
  // South America
  AR: "SA", BO: "SA", BR: "SA", CL: "SA", CO: "SA", EC: "SA", GY: "SA", PE: "SA",
  PY: "SA", SR: "SA", UY: "SA", VE: "SA",
  // Oceania
  AU: "OC", FJ: "OC", NC: "OC", NZ: "OC", PF: "OC", PG: "OC", WS: "OC",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequest = 0;

/** GET a JSON document, cached on disk by URL; throttled and retried. */
async function cachedJson(url) {
  const key = createHash("sha1").update(url).digest("hex").slice(0, 20);
  const file = path.join(CACHE_DIR, "open-meteo", `${key}.json`);
  if (existsSync(file)) return JSON.parse(await readFile(file, "utf8"));

  for (let attempt = 1; ; attempt++) {
    const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), {
          fatal: true,
        });
      }
      const text = await res.text();
      const data = JSON.parse(text);
      if (typeof data !== "object" || data === null || data.error) {
        throw new Error(`Unexpected payload for ${url}: ${text.slice(0, 200)}`);
      }
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text);
      return data;
    } catch (error) {
      if (error.fatal || attempt >= 6) throw error;
      const backoff = 2_000 * 2 ** (attempt - 1);
      console.warn(`  ! ${error.message} – retrying in ${backoff / 1000}s`);
      await sleep(backoff);
    }
  }
}

const geocode = (name, language) =>
  cachedJson(
    `${GEOCODE}?name=${encodeURIComponent(name)}&count=10&language=${language}&format=json`
  ).then((data) => data.results ?? []);

const sameName = (a, b) => slugify(a) === slugify(b);

function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const round = (value, digits) => Number(value.toFixed(digits));

/** Stable negative id for places GeoNames cannot resolve. */
function syntheticId(cc, name) {
  return -parseInt(createHash("sha1").update(`${cc}:${name}`).digest("hex").slice(0, 7), 16);
}

/** Populated places only (no islands, airports, regions, ruins…). */
const isPopulated = (r) => /^PPL(?!H|Q|W|CH)/.test(r.feature_code ?? "");

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

async function readCuratedCities() {
  // [name, countryCode, lat, lon] — the hand-curated core list.
  const seed = JSON.parse(await readFile(path.join(ROOT, "scripts", "seed-cities.json"), "utf8"));
  const entries = [];
  for (const [name, cc, lat, lon] of seed) {
    entries.push({
      en: name,
      cc,
      q: name,
      alt: QUERY_ALIASES[`${cc}:${name}`],
      lat: Number(lat),
      lon: Number(lon),
    });
  }
  if (entries.length < 100) throw new Error(`Parsed only ${entries.length} cities from seed-cities.json`);
  return entries;
}

/* -------------------------------------------------------------------------- */
/* Resolution                                                                 */
/* -------------------------------------------------------------------------- */

const notes = [];
function note(message) {
  notes.push(message);
  console.log(`  * ${message}`);
}

/**
 * Lenient name match: equal slugs, or one is a word-prefix of the other
 * ("Ibiza" ~ "Ibiza Town", "Frankfurt" ~ "Frankfurt am Main").
 */
function nameMatches(name, query) {
  const a = slugify(name);
  const b = slugify(query);
  return a === b || a.startsWith(`${b}-`) || b.startsWith(`${a}-`);
}

/**
 * Pick the GeoNames hit for an input entry, or null.
 * strict: the hit's name must match the query (always required without coords).
 */
function pick(results, entry, query, strict) {
  let pool = results.filter((r) => r.country_code === entry.cc && isPopulated(r));
  if (strict) pool = pool.filter((r) => nameMatches(r.name, query));
  if (!pool.length) return null;

  if (entry.lat !== undefined) {
    const ranked = pool
      .map((r) => ({ r, d: distanceKm(entry.lat, entry.lon, r.latitude, r.longitude) }))
      .filter(({ d }) => d <= MATCH_RADIUS_KM)
      .sort(
        (a, b) =>
          Number(sameName(b.r.name, query)) - Number(sameName(a.r.name, query)) ||
          (b.r.population ?? 0) - (a.r.population ?? 0) ||
          a.d - b.d
      );
    return ranked.length ? { ...ranked[0].r, _distance: ranked[0].d } : null;
  }

  const isSection = (r) => r.feature_code === "PPLX";
  pool.sort(
    (a, b) =>
      Number(sameName(b.name, query)) - Number(sameName(a.name, query)) ||
      Number(isSection(a)) - Number(isSection(b)) ||
      (b.population ?? 0) - (a.population ?? 0)
  );
  const chosen = pool[0];
  const rivals = pool.filter((r) => r !== chosen && sameName(r.name, chosen.name));
  if (rivals.length) {
    note(
      `${entry.en} (${entry.cc}): ${rivals.length + 1} same-name hits, picked #${chosen.id} ${chosen.admin1 ?? ""} pop ${chosen.population ?? 0}; others: ` +
        rivals.map((r) => `#${r.id} ${r.admin1 ?? ""} pop ${r.population ?? 0}`).join(", ")
    );
  }
  return chosen;
}

const getById = (id, language) =>
  cachedJson(`${GEOCODE.replace("/search", "/get")}?id=${id}&language=${language}`);

async function resolve(entry) {
  const label = `${entry.en} (${entry.cc})`;
  // Names are matched per language: "Plzeň" only resolves in Czech, "Cologne" only in English.
  const queries = [
    [entry.q, "en"],
    [entry.q, "cs"],
    ...(entry.alt ?? []).flatMap((q) => [[q, "en"], [q, "cs"]]),
  ];
  const seen = [];
  let hit = entry.id ? { id: entry.id, name: entry.en } : null;
  let via = entry.id ? { query: "(fixed id)", language: "en", strict: true } : null;
  for (const strict of hit ? [] : entry.lat === undefined ? [true] : [true, false]) {
    for (const [query, language] of queries) {
      const results = await geocode(query, language);
      seen.push(...results);
      hit = pick(results, entry, query, strict);
      if (hit) {
        via = { query, language, strict };
        break;
      }
    }
    if (hit) break;
  }

  if (!hit) {
    if (entry.lat === undefined) throw new Error(`${label}: not found and no coordinates given`);
    const meta = await cachedJson(
      `${FORECAST}?latitude=${entry.lat}&longitude=${entry.lon}&timezone=auto`
    );
    const nearby = seen
      .filter((r) => r.country_code === entry.cc)
      .map((r) => ({ r, d: distanceKm(entry.lat, entry.lon, r.latitude, r.longitude) }))
      .filter(({ d }) => d <= MATCH_RADIUS_KM)
      .sort((a, b) => a.d - b.d)[0]?.r;
    note(
      `${label}: no populated place in GeoNames – keeping input coords, tz/elevation from forecast API (${meta.timezone}, ${meta.elevation} m)` +
        (nearby ? `, admin1 from nearby ${nearby.feature_code} "${nearby.name}" #${nearby.id}` : "")
    );
    const nearbyCs = nearby ? await getById(nearby.id, "cs") : null;
    return {
      id: syntheticId(entry.cc, entry.en),
      cc: entry.cc,
      en: entry.en,
      cs: entry.cs ?? entry.en,
      a1: nearby?.admin1 ? { en: nearby.admin1, cs: nearbyCs?.admin1 ?? nearby.admin1 } : undefined,
      lat: entry.lat,
      lon: entry.lon,
      ele: meta.elevation,
      tz: meta.timezone,
      pop: 0,
    };
  }

  if (via.language !== "en" || via.query !== entry.q || !via.strict) {
    note(`${label}: matched via ${via.strict ? "" : "non-strict "}${via.language} query "${via.query}" → "${hit.name}" #${hit.id}`);
  }
  if (hit._distance > 15) {
    note(`${label}: "${hit.name}" #${hit.id} is ${hit._distance.toFixed(1)} km from the input coords`);
  }

  const en = await getById(hit.id, "en");
  const cs = await getById(hit.id, "cs");
  if (!sameName(en.name, entry.en)) note(`${label}: GeoNames English name is "${en.name}" – keeping "${entry.en}"`);

  let { elevation: ele, timezone: tz } = en;
  if (ele !== undefined && ele <= -1000) ele = undefined; // GeoNames "unknown" (-9999)
  if (ele === undefined || tz === undefined) {
    const meta = await cachedJson(
      `${FORECAST}?latitude=${en.latitude}&longitude=${en.longitude}&timezone=auto`
    );
    note(`${label}: elevation/timezone missing in GeoNames – using forecast API`);
    ele ??= meta.elevation;
    tz ??= meta.timezone;
  }

  return {
    id: en.id,
    cc: entry.cc,
    en: entry.en,
    cs: entry.cs ?? cs.name ?? entry.en,
    a1: en.admin1 ? { en: en.admin1, cs: cs.admin1 ?? en.admin1 } : undefined,
    lat: en.latitude,
    lon: en.longitude,
    ele,
    tz,
    pop: en.population ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

/** Slugs of the current dataset, which are published URLs and must survive a rebuild. */
async function readPublishedSlugs() {
  const read = async (file, fallback) => {
    const full = path.join(OUT_DIR, file);
    return existsSync(full) ? JSON.parse(await readFile(full, "utf8")) : fallback;
  };
  const places = await read("places.json", []);
  const countries = await read("countries.json", {});
  return {
    places: new Map(places.map((p) => [p.id, p.slug])),
    countries: new Map(Object.entries(countries).map(([cc, c]) => [cc, c.slug])),
  };
}

async function main() {
  console.log(`cache: ${CACHE_DIR}`);
  const previous = await readPublishedSlugs();
  console.log(`published: ${previous.places.size} place slugs, ${previous.countries.size} country slugs`);
  const curated = await readCuratedCities();
  const curatedKeys = new Set(curated.map((e) => `${e.cc}:${slugify(e.en)}`));

  const extra = [];
  for (const [en, cc, options = {}] of EXTRA) {
    if (curatedKeys.has(`${cc}:${slugify(en)}`)) {
      console.log(`  - skipping ${en} (${cc}): already in seed-cities.json`);
      continue;
    }
    extra.push({ en, cc, q: options.q ?? en, ...options });
  }
  const entries = [...curated, ...extra];
  console.log(`input: ${curated.length} curated + ${extra.length} extra = ${entries.length}`);

  const places = [];
  const byId = new Map();
  const usedA1Fixes = new Set();
  for (const [index, entry] of entries.entries()) {
    process.stdout.write(`[${index + 1}/${entries.length}] ${entry.en} (${entry.cc})\n`);
    const place = await resolve(entry);
    const duplicate = byId.get(place.id);
    if (duplicate) {
      note(`${entry.en} (${entry.cc}) resolves to the same place as ${duplicate.en} (#${place.id}) – skipped`);
      continue;
    }
    const fix = OVERRIDES[`${place.cc}:${place.en}`];
    if (fix) Object.assign(place, fix);
    const a1Fix = place.a1 && A1_FIXES[`${place.cc}|${place.a1.en}`];
    if (a1Fix) {
      usedA1Fixes.add(`${place.cc}|${place.a1.en}`);
      place.a1 = { en: a1Fix[0] ?? place.a1.en, cs: a1Fix[1] ?? place.a1.cs };
    }
    byId.set(place.id, place);
    places.push(place);
  }

  for (const key of Object.keys(A1_FIXES)) {
    if (!usedA1Fixes.has(key)) console.warn(`  ! unused admin1 fix ${key}`);
  }

  // Slugs, unique per country and locale. Published slugs are kept (see
  // scripts/lib/slugs.mjs); only new places get fresh ones.
  for (const message of assignPlaceSlugs(places, previous.places)) note(message);

  const output = places
    .map((p) => {
      const out = {
        id: p.id,
        cc: p.cc,
        en: p.en,
        cs: p.cs,
        slug: { en: p.slug.en, cs: p.slug.cs },
      };
      if (p.a1?.en) out.a1 = { en: p.a1.en, cs: p.a1.cs ?? p.a1.en };
      Object.assign(out, {
        lat: round(p.lat, 4),
        lon: round(p.lon, 4),
        ele: Math.round(p.ele ?? 0),
        tz: p.tz,
        pop: p.pop ?? 0,
      });
      return out;
    })
    .sort((a, b) => b.pop - a.pop || a.en.localeCompare(b.en, "en"));

  // Countries.
  const displayEn = new Intl.DisplayNames(["en"], { type: "region" });
  const displayCs = new Intl.DisplayNames(["cs"], { type: "region" });
  const countries = {};
  for (const cc of [...new Set(output.map((p) => p.cc))].sort()) {
    const continent = CONTINENT[cc];
    if (!continent) throw new Error(`No continent mapping for ${cc}`);
    const en = COUNTRY_NAME_FIXES[cc]?.en ?? displayEn.of(cc);
    const cs = COUNTRY_NAME_FIXES[cc]?.cs ?? displayCs.of(cc);
    if (/[()&]|SAR| - | – /.test(`${en}|${cs}`)) {
      console.warn(`  ! odd country name for ${cc}: "${en}" / "${cs}" – add a fix`);
    }
    countries[cc] = { en, cs, slug: {}, continent };
  }
  // Country names come from ICU and can change with the Node version; the
  // published slugs must not.
  for (const message of assignCountrySlugs(countries, previous.countries)) note(message);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "places.json"),
    `[\n${output.map((p) => `  ${JSON.stringify(p)}`).join(",\n")}\n]\n`
  );
  await writeFile(
    path.join(OUT_DIR, "countries.json"),
    `{\n${Object.entries(countries)
      .map(([cc, c]) => `  ${JSON.stringify(cc)}: ${JSON.stringify(c)}`)
      .join(",\n")}\n}\n`
  );

  console.log(`\nwrote ${output.length} places, ${Object.keys(countries).length} countries`);
  console.log(`${notes.length} notes (see "*" lines above)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
