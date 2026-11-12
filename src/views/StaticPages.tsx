import type { Metadata } from "next";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { pagePath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { formatCalendarDate } from "@/lib/datetime";
import PageShell, { Bullets, FeatureGrid, Section } from "@/components/PageShell";

/** Bump when the legal texts change. */
const LEGAL_UPDATED = new Date(Date.UTC(2026, 10, 12));

const linkClass =
  "font-medium text-sky-600 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-500 dark:text-sky-300";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-400/40 bg-slate-900/8 px-1.5 py-0.5 font-mono text-[0.7rem] dark:bg-white/10">
      {children}
    </kbd>
  );
}

type Page = "about" | "privacy" | "terms";

const META: Record<Page, Record<Locale, { title: string; description: string }>> = {
  about: {
    en: {
      title: "About",
      description:
        "About WeatherNow: a fast, ad-free weather site with hourly and 14-day forecasts, air quality and climate averages for cities worldwide.",
    },
    cs: {
      title: "O aplikaci",
      description:
        "O WeatherNow: rychlé počasí bez reklam s hodinovou a 14denní předpovědí, kvalitou ovzduší a klimatickými průměry pro města po celém světě.",
    },
  },
  privacy: {
    en: { title: "Privacy Policy", description: "How WeatherNow handles your data: no accounts, no ad trackers, preferences stored in your browser." },
    cs: { title: "Ochrana soukromí", description: "Jak WeatherNow zachází s vašimi daty: žádné účty, žádné reklamní sledování, nastavení zůstává ve vašem prohlížeči." },
  },
  terms: {
    en: { title: "Terms of Service", description: "Terms of use for WeatherNow, its forecasts and the free weather widget." },
    cs: { title: "Podmínky použití", description: "Podmínky použití WeatherNow, jeho předpovědí a bezplatného widgetu s počasím." },
  },
};

export function staticMetadata(locale: Locale, page: Page): Metadata {
  const m = META[page][locale];
  return pageMetadata({
    locale,
    title: m.title,
    description: m.description,
    path: pagePath(locale, page),
    alternates: { en: pagePath("en", page), cs: pagePath("cs", page) },
  });
}

/* ------------------------------------------------------------------ about */

export function AboutView({ locale }: { locale: Locale }) {
  if (locale === "cs") {
    return (
      <PageShell title="O WeatherNow" lead="Rychlé počasí bez reklam, které se dá opravdu číst.">
        <Section heading="Co je WeatherNow?">
          <p>
            WeatherNow převádí surová meteorologická data do podoby, podle které se dá během pár vteřin
            rozhodnout. Místo zdi čísel dostanete živou oblohu podle aktuálního počasí, interaktivní vývoj
            teploty a srozumitelná doporučení — co si obléct nebo jestli budete odpoledne potřebovat deštník.
          </p>
          <p>
            Každé město má vlastní stránky: přehled, předpověď na zítra, po hodinách a na 14 dní, kvalitu
            ovzduší, východ a západ slunce a klimatické průměry po měsících.
          </p>
        </Section>
        <Section heading="Co najdete">
          <FeatureGrid
            features={[
              { emoji: "🌡️", title: "Aktuální stav", text: "Teplota, pocitová teplota, vlhkost, vítr s kompasem, tlak, dohlednost, oblačnost a UV index." },
              { emoji: "📈", title: "Vývoj po hodinách", text: "Teplota a pocitová teplota na 48 hodin s pravděpodobností srážek." },
              { emoji: "📅", title: "Výhled na 14 dní", text: "Maxima a minima, srážky, vítr a UV pro dva týdny dopředu." },
              { emoji: "🍃", title: "Ovzduší a pyl", text: "Evropský index kvality ovzduší, jednotlivé znečišťující látky a v Evropě i pyl." },
              { emoji: "🌞", title: "Slunce a Měsíc", text: "Východ a západ slunce na 30 dní, délka dne, fáze Měsíce a slunovraty." },
              { emoji: "🗓️", title: "Podnebí", text: "Průměrné teploty, srážky a slunce po měsících — a kdy je nejlepší doba k návštěvě." },
            ]}
          />
        </Section>
        <Section heading="Jak na to">
          <Bullets
            items={[
              <>Stiskněte <Kbd>/</Kbd> kdekoli na stránce a začněte psát název města.</>,
              "Tlačítkem polohy použijete GPS svého zařízení.",
              "Srdíčkem uložíte město do svých míst.",
              "V záhlaví přepnete °C/°F a světlý, tmavý nebo systémový motiv.",
              "Všechny časy jsou v místním čase zobrazeného místa, ne ve vašem.",
            ]}
          />
        </Section>
        <Section heading="Odkud jsou data">
          <p>
            Předpověď, aktuální stav, kvalita ovzduší a vyhledávání míst pochází z{" "}
            <Ext href="https://open-meteo.com/">Open-Meteo</Ext> (licence CC BY 4.0), který kombinuje
            modely národních meteorologických služeb. Časy východu a západu slunce na 30 dní a fáze Měsíce
            počítáme astronomicky. Klimatické průměry vycházejí z dlouhodobých normálů (zdroj je uveden u
            každé stránky podnebí).
          </p>
          <p>
            Hodnocení aktivit jsou heuristiky pro zábavu. Výstrahy před nebezpečným počasím vždy sledujte u
            národní meteorologické služby (v Česku <Ext href="https://www.chmi.cz/">ČHMÚ</Ext>).
          </p>
        </Section>
        <Section heading="O autorovi">
          <p>
            WeatherNow vytvořil <strong>Robert Libsansky</strong>, vývojář zaměřený na rychlé a přístupné
            webové aplikace v Next.js a TypeScriptu. Zdrojový kód je na{" "}
            <Ext href="https://github.com/RobertLib/weather-now">GitHubu</Ext>. Chcete počasí na svém webu?
            Vyzkoušejte <Link href={pagePath("cs", "widget")} className={linkClass}>widget zdarma</Link>.
          </p>
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell title="About WeatherNow" lead="A fast, ad-free weather site built to make forecasts genuinely readable.">
      <Section heading="What is WeatherNow?">
        <p>
          WeatherNow turns raw meteorological data into something you can act on in a few seconds. Instead
          of a wall of numbers you get a live sky that reflects the current conditions, an interactive
          temperature trend, and plain-language takeaways such as what to wear or whether you will want an
          umbrella this afternoon.
        </p>
        <p>
          Every city has its own pages: an overview, tomorrow, hourly and 14-day forecasts, air quality,
          sunrise and sunset times, and monthly climate averages.
        </p>
      </Section>
      <Section heading="What you get">
        <FeatureGrid
          features={[
            { emoji: "🌡️", title: "Live conditions", text: "Temperature, feels-like, humidity, wind with a compass, pressure trend, visibility, cloud cover and UV index." },
            { emoji: "📈", title: "Hour by hour", text: "A 48-hour temperature and feels-like trend with precipitation chance." },
            { emoji: "📅", title: "14-day outlook", text: "Highs and lows, rain, wind and UV for the next two weeks." },
            { emoji: "🍃", title: "Air quality and pollen", text: "The European AQI, the pollutants behind it and, in Europe, pollen levels." },
            { emoji: "🌞", title: "Sun and moon", text: "Sunrise and sunset for 30 days, daylight length, moon phases and the solstices." },
            { emoji: "🗓️", title: "Climate", text: "Average temperatures, rainfall and sunshine by month — and the best time to visit." },
          ]}
        />
      </Section>
      <Section heading="How to get around">
        <Bullets
          items={[
            <>Press <Kbd>/</Kbd> anywhere to jump into the search box, then use the arrow keys to pick a suggestion.</>,
            "Tap the location button to use your device's GPS position.",
            "Tap the heart on the current city to save it to your places.",
            "Switch between °C and °F, and between light, dark and system themes, from the header.",
            "Every reading is shown in the local time of the place you are looking at, not your own.",
          ]}
        />
      </Section>
      <Section heading="Where the data comes from">
        <p>
          Forecasts, current conditions, air quality and place search come from{" "}
          <Ext href="https://open-meteo.com/">Open-Meteo</Ext> (CC BY 4.0), which combines models from
          national weather services. Thirty-day sunrise and sunset times and moon phases are calculated
          astronomically. Climate averages are long-term normals; the source is credited on every climate
          page.
        </p>
        <p>
          The activity ratings are heuristics meant to be fun and roughly useful. For warnings and severe
          weather, always check your national weather service.
        </p>
      </Section>
      <Section heading="About the developer">
        <p>
          WeatherNow was created by <strong>Robert Libsansky</strong>, a developer focused on fast,
          accessible web applications built with Next.js and TypeScript. The source code is on{" "}
          <Ext href="https://github.com/RobertLib/weather-now">GitHub</Ext>. Want the weather on your own
          site? Try the <Link href={pagePath("en", "widget")} className={linkClass}>free widget</Link>.
        </p>
      </Section>
    </PageShell>
  );
}

/* ---------------------------------------------------------------- privacy */

export function PrivacyView({ locale }: { locale: Locale }) {
  const updated = formatCalendarDate(LEGAL_UPDATED, locale);
  if (locale === "cs") {
    return (
      <PageShell title="Ochrana soukromí" lead={`Naposledy aktualizováno: ${updated}`}>
        <Section heading="Stručně">
          <p>
            WeatherNow nemá účty, profily ani reklamní sledování. Uložená místa, jednotky a motiv zůstávají
            v lokálním úložišti vašeho prohlížeče a nikdy nám je neposíláte.
          </p>
        </Section>
        <Section heading="Jaké údaje zpracováváme">
          <Bullets
            items={[
              "Názvy míst nebo souřadnice, které vyhledáte; váš prohlížeč je posílá přímo službě Open-Meteo, aby získal předpověď.",
              "Přibližnou polohu odvozenou z IP adresy (město), kterou poskytuje náš hosting Vercel. Používáme ji jen k tomu, abychom na úvodní stránce ukázali počasí ve vašem okolí; neukládáme ji.",
              "Přesnou polohu pouze tehdy, když výslovně povolíte tlačítko polohy. Použije se pro jedno vyhledání a na server se neukládá.",
              "Anonymní souhrnné statistiky návštěvnosti (zobrazení stránek a výkon) z Vercel Analytics bez cookies.",
            ]}
          />
        </Section>
        <Section heading="Uloženo ve vašem prohlížeči">
          <p>Tato nastavení zůstávají v lokálním úložišti vašeho zařízení. Smazáním dat prohlížeče je trvale odstraníte.</p>
          <Bullets items={["Vaše uložená místa", "Jednotky (°C nebo °F)", "Barevný motiv", "Naposledy zobrazené místo"]} />
        </Section>
        <Section heading="Služby třetích stran">
          <Bullets
            items={[
              <><strong>Open-Meteo</strong> dostává souřadnice míst, pro která se načítá počasí, kvalita ovzduší nebo vyhledávání.</>,
              <><strong>Vercel</strong> stránky hostuje a poskytuje analytiku bez cookies.</>,
            ]}
          />
        </Section>
        <Section heading="Widget">
          <p>
            Widget vložený na cizí web načítá data z WeatherNow, nepoužívá cookies a nesleduje návštěvníky
            webu, na kterém je umístěn.
          </p>
        </Section>
        <Section heading="Kontakt">
          <p>
            Dotazy k těmto zásadám můžete položit jako issue v{" "}
            <Ext href="https://github.com/RobertLib/weather-now">repozitáři projektu</Ext>.
          </p>
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell title="Privacy Policy" lead={`Last updated: ${updated}`}>
      <Section heading="The short version">
        <p>
          WeatherNow has no accounts, no profiles and no advertising trackers. Your saved cities, unit choice
          and theme live in your own browser&apos;s local storage and are never sent to us.
        </p>
      </Section>
      <Section heading="Information we process">
        <Bullets
          items={[
            "The places or coordinates you search for, which your browser sends directly to Open-Meteo to fetch a forecast.",
            "An approximate, city-level location derived from your IP address by our host, Vercel. It is used only to show local weather on the homepage and is not stored.",
            "Your precise location, only if you explicitly grant permission with the location button. It is used for that single lookup and is not stored on a server.",
            "Aggregated, anonymous usage statistics (page views and performance) collected by Vercel Analytics without cookies.",
          ]}
        />
      </Section>
      <Section heading="Stored in your browser">
        <p>
          These preferences are kept in local storage on your device so the site remembers them on your next
          visit. Clearing your browser data removes them permanently.
        </p>
        <Bullets items={["Your saved places", "Your unit system (°C or °F)", "Your theme preference", "The last place you looked at"]} />
      </Section>
      <Section heading="Third-party services">
        <Bullets
          items={[
            <><strong>Open-Meteo</strong> receives the coordinates of places whose weather, air quality or search results are requested.</>,
            <><strong>Vercel</strong> hosts the site and provides privacy-friendly, cookie-free analytics.</>,
          ]}
        />
      </Section>
      <Section heading="The widget">
        <p>
          The embeddable widget loads its data from WeatherNow, sets no cookies and does not track visitors of
          the sites it is embedded on.
        </p>
      </Section>
      <Section heading="Contact">
        <p>
          Questions about this policy can be raised as an issue on the{" "}
          <Ext href="https://github.com/RobertLib/weather-now">project repository</Ext>.
        </p>
      </Section>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ terms */

export function TermsView({ locale }: { locale: Locale }) {
  const updated = formatCalendarDate(LEGAL_UPDATED, locale);
  if (locale === "cs") {
    return (
      <PageShell title="Podmínky použití" lead={`Naposledy aktualizováno: ${updated}`}>
        <Section heading="Přijetí podmínek">
          <p>Používáním WeatherNow souhlasíte s těmito podmínkami. Pokud s nimi nesouhlasíte, službu prosím nepoužívejte.</p>
        </Section>
        <Section heading="Použití služby">
          <p>
            WeatherNow je zdarma pro osobní, nekomerční použití a zdrojový kód je zveřejněn pod licencí MIT.
            Zavazujete se, že nebudete:
          </p>
          <Bullets
            items={[
              "narušovat, přetěžovat nebo automatizovaně zneužívat službu či zdroje dat, ze kterých čerpá,",
              "šířit data o počasí v rozporu s licencí jejich poskytovatelů (Open-Meteo, CC BY 4.0),",
              "odstraňovat nebo skrývat autorská práva a odkazy na zdroje, včetně odkazu ve widgetu.",
            ]}
          />
        </Section>
        <Section heading="Přesnost předpovědi">
          <p>
            Informace o počasí mají pouze informativní charakter. Předpovědi jsou z povahy věci nejisté a
            hodnocení aktivit i doporučení jsou heuristiky, nikoli meteorologické rady.
          </p>
          <p>
            <strong>Nikdy se na WeatherNow nespoléhejte při rozhodnutích, na kterých závisí bezpečnost.</strong>{" "}
            Výstrahy před bouřkami, povodněmi a podklady pro letectví, plavbu či hory vždy ověřte u národní
            meteorologické služby.
          </p>
        </Section>
        <Section heading="Dostupnost">
          <p>
            Služba závisí na API třetích stran a může být kdykoli nedostupná, zpožděná nebo omezená. Je
            poskytována „tak, jak je“, bez jakýchkoli záruk.
          </p>
        </Section>
        <Section heading="Omezení odpovědnosti">
          <p>
            V maximálním rozsahu povoleném zákonem WeatherNow ani jeho autor neodpovídají za škody vzniklé
            používáním nebo nemožností používat službu, včetně rozhodnutí učiněných na základě zobrazených
            informací.
          </p>
        </Section>
        <Section heading="Změny podmínek">
          <p>Podmínky se mohou kdykoli změnit. Dalším používáním webu souhlasíte s aktuálním zněním.</p>
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell title="Terms of Service" lead={`Last updated: ${updated}`}>
      <Section heading="Acceptance of terms">
        <p>By accessing and using WeatherNow you agree to these terms. If you do not agree with them, please do not use the service.</p>
      </Section>
      <Section heading="Use of the service">
        <p>
          WeatherNow is provided free of charge for personal, non-commercial use, and the source code is
          published under the MIT licence. You agree not to:
        </p>
        <Bullets
          items={[
            "Attempt to disrupt, overload or automate abusive traffic against the service or its upstream data sources",
            "Redistribute the weather data in breach of its providers' licences (Open-Meteo, CC BY 4.0)",
            "Remove or obscure copyright or attribution notices, including the credit link in the widget",
          ]}
        />
      </Section>
      <Section heading="Forecast accuracy">
        <p>
          Weather information is provided for general informational purposes only. Forecasts are inherently
          uncertain, and the activity ratings and plain-language tips are heuristics rather than
          meteorological advice.
        </p>
        <p>
          <strong>Never rely on WeatherNow for safety-critical decisions.</strong> For storm warnings, flood
          alerts, aviation, marine or mountain planning, always consult your official national weather service.
        </p>
      </Section>
      <Section heading="Availability">
        <p>
          The service depends on third-party APIs and may be unavailable, delayed or rate-limited at any time.
          It is offered &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind.
        </p>
      </Section>
      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, WeatherNow and its author are not liable for any damages
          arising from the use of, or inability to use, this service — including decisions made on the basis
          of the information shown.
        </p>
      </Section>
      <Section heading="Changes to these terms">
        <p>These terms may be revised at any time without notice. Continuing to use the site means you accept the current version.</p>
      </Section>
    </PageShell>
  );
}
