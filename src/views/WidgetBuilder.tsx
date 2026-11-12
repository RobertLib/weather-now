"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { getDictionary } from "@/i18n";
import { PlaceIndex, indexPlacePath, loadPlaceIndex } from "@/lib/places-client";
import { SITE_URL, absoluteUrl } from "@/lib/routes";

type Theme = "auto" | "light" | "dark";

const field =
  "w-full rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100";

/** Pick a city, theme and language; preview the widget and copy its snippet. */
export default function WidgetBuilder() {
  const { t, locale } = useI18n();
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [placeKey, setPlaceKey] = useState("");
  const [theme, setTheme] = useState<Theme>("auto");
  const [lang, setLang] = useState<Locale>(locale);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPlaceIndex()
      .then((idx) => {
        setIndex(idx);
        // `?place=czechia/prague` (English slugs) preselects a city.
        const wanted = new URLSearchParams(window.location.search).get("place");
        const match = wanted && idx.places.find((p) => `${idx.countries[p[1]][2]}/${p[4]}` === wanted);
        setPlaceKey(String((match || idx.places[0])[0]));
      })
      .catch(() => {});
  }, []);

  const groups = useMemo(() => {
    if (!index) return [];
    const L = lang === "en" ? 0 : 1;
    const collator = new Intl.Collator(lang);
    const byCc = new Map<string, PlaceIndex["places"]>();
    for (const p of index.places) byCc.set(p[1], [...(byCc.get(p[1]) ?? []), p]);
    return [...byCc.entries()]
      .map(([cc, places]) => ({
        cc,
        name: index.countries[cc][L],
        places: [...places].sort((a, b) => collator.compare(a[2 + L] as string, b[2 + L] as string)),
      }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [index, lang]);

  const selected = index?.places.find((p) => String(p[0]) === placeKey);
  const L = lang === "en" ? 0 : 1;
  const country = selected && index ? index.countries[selected[1]] : null;
  const embedSrc =
    selected && country ? `/embed/${lang}/${country[2 + L]}/${selected[4 + L]}?theme=${theme}` : null;
  const pageUrl =
    selected && index ? absoluteUrl(indexPlacePath(index, selected, lang)) : SITE_URL;
  const name = selected ? selected[2 + L] : "";
  // The snippet speaks the widget's language, not necessarily the page's.
  const credit = getDictionary(lang).widget.credit;

  const snippet = embedSrc
    ? `<iframe src="${SITE_URL}${embedSrc}" title="${name} – WeatherNow" width="100%" height="260" style="border:0;border-radius:16px;max-width:420px" loading="lazy"></iframe>\n<p style="font:12px/1.4 system-ui,sans-serif;margin:4px 0 0">${credit} <a href="${pageUrl}">WeatherNow</a></p>`
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the code is still selectable */
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.widget.city}</span>
          <select className={field} value={placeKey} onChange={(e) => setPlaceKey(e.target.value)} disabled={!index}>
            {!index && <option>{t.widget.cityPlaceholder}</option>}
            {groups.map((g) => (
              <optgroup key={g.cc} label={g.name}>
                {g.places.map((p) => (
                  <option key={p[0]} value={p[0]}>
                    {p[2 + L]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">{t.widget.theme}</legend>
          <div className="flex flex-wrap gap-2">
            {(["auto", "light", "dark"] as Theme[]).map((option) => (
              <label key={option} className="glass-soft inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
                <input type="radio" name="theme" value={option} checked={theme === option} onChange={() => setTheme(option)} />
                {t.widget.themes[option]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">{t.widget.language}</legend>
          <div className="flex gap-2">
            {(["en", "cs"] as Locale[]).map((option) => (
              <label key={option} className="glass-soft inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
                <input type="radio" name="lang" value={option} checked={lang === option} onChange={() => setLang(option)} />
                {option === "en" ? "English" : "Čeština"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold">{t.widget.code}</span>
            <button
              type="button"
              onClick={copy}
              disabled={!snippet}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? t.widget.copied : t.widget.copy}
            </button>
          </div>
          <textarea readOnly value={snippet} rows={6} className={`${field} font-mono text-xs`} onFocus={(e) => e.target.select()} />
        </div>

        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
          {t.widget.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold">{t.widget.preview}</p>
        {embedSrc ? (
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={`${name} – WeatherNow`}
            width="100%"
            height={260}
            style={{ border: 0, borderRadius: 16, maxWidth: 420 }}
          />
        ) : (
          <div className="glass-soft h-65 max-w-105 animate-pulse rounded-2xl" />
        )}
      </div>
    </div>
  );
}
