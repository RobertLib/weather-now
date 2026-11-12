/**
 * URL slugs for places and countries.
 *
 * Slugs end up in indexed URLs (/weather/czechia/prague), so a regenerated
 * dataset must keep every slug that is already published. GeoNames renames a
 * place now and then, `Intl.DisplayNames` country names change with Node's ICU
 * data, and a newly added namesake would otherwise force a suffix on the
 * existing city too. Existing slugs are therefore carried over by id (places)
 * or country code (countries); only new entries get fresh slugs.
 */

const LOCALES = ["en", "cs"];

const SPECIAL_LETTERS = {
  ł: "l", Ł: "L", đ: "d", Đ: "D", ø: "o", Ø: "O", æ: "ae", Æ: "AE", œ: "oe",
  Œ: "OE", ß: "ss", þ: "th", Þ: "TH", ð: "d", Ð: "D", ı: "i", ħ: "h", Ħ: "H",
};

/** Lowercase ASCII with accents stripped. */
export function fold(value) {
  return value
    .replace(/[łŁđĐøØæÆœŒßþÞðÐıħĦ]/g, (ch) => SPECIAL_LETTERS[ch])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function slugify(value) {
  return fold(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Sets `place.slug = { en, cs }` on every place, unique per country and
 * locale. Places listed in `previous` (id → slugs) keep their slugs; new
 * places get `slugify(name)`, suffixed with the region (or id) when the slug
 * is taken. Returns human-readable notes about everything worth reviewing.
 *
 * @param {Array<{ id: number, cc: string, en: string, cs: string, a1?: { en: string, cs?: string } }>} places
 * @param {Map<number, { en: string, cs: string }>} previous
 * @returns {string[]}
 */
export function assignPlaceSlugs(places, previous) {
  const notes = [];
  for (const place of places) place.slug ??= {};

  for (const locale of LOCALES) {
    const taken = new Set();
    const key = (place, slug) => `${place.cc}/${slug}`;

    // 1. Published slugs are fixed, even if the name behind them changed.
    for (const place of places) {
      const old = previous.get(place.id)?.[locale];
      if (!old) continue;
      if (taken.has(key(place, old))) throw new Error(`Duplicate published slug ${locale}:${key(place, old)}`);
      place.slug[locale] = old;
      taken.add(key(place, old));
      const natural = slugify(place[locale]);
      if (natural !== old && !old.startsWith(`${natural}-`)) {
        notes.push(`kept slug ${locale}:${key(place, old)} although the name is now "${place[locale]}"`);
      }
    }

    // 2. New places: the plain slug when it is free and unique among the new
    //    ones, otherwise a region (or id) suffix — on the new places only.
    const fresh = places.filter((p) => !previous.get(p.id)?.[locale]);
    const groups = new Map();
    for (const place of fresh) {
      const k = key(place, slugify(place[locale]));
      groups.set(k, [...(groups.get(k) ?? []), place]);
    }
    for (const [k, group] of groups) {
      const clash = group.length > 1 || taken.has(k);
      for (const place of group) {
        let slug = slugify(place[locale]);
        if (clash) {
          const region = place.a1?.[locale] ?? place.a1?.en;
          slug = region ? `${slug}-${slugify(region)}` : `${slug}-${Math.abs(place.id)}`;
          if (taken.has(key(place, slug))) slug = `${slug}-${Math.abs(place.id)}`;
        }
        if (taken.has(key(place, slug))) throw new Error(`Slug not unique after suffixing: ${locale}:${key(place, slug)}`);
        place.slug[locale] = slug;
        taken.add(key(place, slug));
      }
      if (clash) notes.push(`slug collision ${locale}:${k} → ${group.map((p) => p.slug[locale]).join(", ")}`);
    }
  }

  const current = new Set(places.map((p) => p.id));
  for (const [id, slugs] of previous) {
    if (!current.has(id)) notes.push(`place #${id} (${slugs.en}) was removed — its published URLs will now 404`);
  }
  return notes;
}

/**
 * Slugs for countries (cc → { en, cs, … }), keeping published ones by
 * country code. Mutates each entry's `slug`; returns review notes.
 *
 * @param {Record<string, { en: string, cs: string, slug?: { en: string, cs: string } }>} countries
 * @param {Map<string, { en: string, cs: string }>} previous
 * @returns {string[]}
 */
export function assignCountrySlugs(countries, previous) {
  const notes = [];
  for (const locale of LOCALES) {
    const owner = new Map();
    for (const [cc, country] of Object.entries(countries)) {
      country.slug ??= {};
      const old = previous.get(cc)?.[locale];
      const natural = slugify(country[locale]);
      const slug = old ?? natural;
      if (old && old !== natural) {
        notes.push(`kept country slug ${locale}:${old} although the name is now "${country[locale]}"`);
      }
      if (owner.has(slug)) throw new Error(`Country slug ${locale}:${slug} used by ${owner.get(slug)} and ${cc}`);
      owner.set(slug, cc);
      country.slug[locale] = slug;
    }
  }
  return notes;
}
