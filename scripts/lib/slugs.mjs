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

/** Letters that don't decompose into a base letter plus accent. */
const SPECIAL_LETTERS = {
  ł: "l", Ł: "L", đ: "d", Đ: "D", ø: "o", Ø: "O", æ: "ae", Æ: "AE", œ: "oe",
  Œ: "OE", ß: "ss", þ: "th", Þ: "TH", ð: "d", Ð: "D", ı: "i", ħ: "h", Ħ: "H",
  ə: "e", Ə: "E", ŧ: "t", Ŧ: "T", ŋ: "n", Ŋ: "N",
};

/**
 * Lowercase with accents stripped. NFKD (not NFD) also splits compatibility
 * characters such as ligatures and digraphs (ﬁ → fi, ǆ → dž → dz). It runs
 * first, so letters that decompose into a special letter work too (ǿ → ø → o).
 * Apostrophes and the ʻokina join the letters around them (Oʻahu → oahu).
 * `src/lib/places-client.ts` mirrors this for search; a test keeps them in sync.
 */
export function fold(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[łŁđĐøØæÆœŒßþÞðÐıħĦəƏŧŦŋŊ]/g, (ch) => SPECIAL_LETTERS[ch])
    .replace(/['‘’ʼʻ]/g, "")
    .toLowerCase();
}

export function slugify(value) {
  return fold(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** What every published slug must look like. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(slug, what) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid slug "${slug}" for ${what}`);
  return slug;
}

/**
 * A place's natural slug in one language. Names in a non-Latin script fold to
 * nothing, so fall back to the English name and finally the id.
 */
function naturalSlug(place, locale) {
  return slugify(place[locale] ?? "") || slugify(place.en ?? "") || `place-${Math.abs(place.id)}`;
}

/**
 * Sets `place.slug = { en, cs }` on every place, unique per country and
 * locale. Places listed in `previous` (id → slugs) keep their slugs; new
 * places get `slugify(name)`, suffixed with the region (or id) when the slug
 * is taken. Returns human-readable notes about everything worth reviewing.
 *
 * @param {Array<{ id: number, cc: string, en: string, cs: string, a1?: { en: string, cs?: string } }>} places
 * @param {Map<number, { en: string, cs: string, cc?: string }>} previous
 * @returns {string[]}
 */
export function assignPlaceSlugs(places, previous) {
  const notes = [];
  for (const place of places) place.slug ??= {};
  // Published slugs by current id, including those a re-issued id takes over.
  const published = adoptReissuedIds(places, previous, notes);

  for (const locale of LOCALES) {
    const taken = new Set();
    const key = (place, slug) => `${place.cc}/${slug}`;

    // 1. Published slugs are fixed, even if the name behind them changed.
    for (const place of places) {
      const old = published.get(place.id)?.[locale];
      if (!old) continue;
      if (taken.has(key(place, old))) throw new Error(`Duplicate published slug ${locale}:${key(place, old)}`);
      place.slug[locale] = old;
      taken.add(key(place, old));
      const natural = naturalSlug(place, locale);
      if (natural !== old && !old.startsWith(`${natural}-`)) {
        notes.push(`kept slug ${locale}:${key(place, old)} although the name is now "${place[locale]}"`);
      }
    }

    // 2. New places: the plain slug when it is free and unique among the new
    //    ones, otherwise a region (or id) suffix — on the new places only.
    const fresh = places.filter((p) => !published.get(p.id)?.[locale]);
    const groups = new Map();
    for (const place of fresh) {
      const k = key(place, naturalSlug(place, locale));
      groups.set(k, [...(groups.get(k) ?? []), place]);
    }
    for (const [k, group] of groups) {
      const clash = group.length > 1 || taken.has(k);
      for (const place of group) {
        let slug = naturalSlug(place, locale);
        if (clash) {
          const region = slugify(place.a1?.[locale] ?? "") || slugify(place.a1?.en ?? "");
          slug = region ? `${slug}-${region}` : `${slug}-${Math.abs(place.id)}`;
          if (taken.has(key(place, slug))) slug = `${slug}-${Math.abs(place.id)}`;
        }
        if (taken.has(key(place, slug))) throw new Error(`Slug not unique after suffixing: ${locale}:${key(place, slug)}`);
        place.slug[locale] = assertSlug(slug, `${place.en} (${place.cc}, ${locale})`);
        taken.add(key(place, slug));
      }
      if (clash) notes.push(`slug collision ${locale}:${k} → ${group.map((p) => p.slug[locale]).join(", ")}`);
    }
  }

  // Published URLs that will break: removed places, and places whose country
  // changed (the country is part of the URL).
  const byId = new Map(places.map((p) => [p.id, p]));
  // Slug records some current place holds (its own or one it took over).
  const held = new Set(places.map((p) => published.get(p.id)).filter(Boolean));
  for (const [id, slugs] of previous) {
    const place = byId.get(id);
    if (place) {
      if (slugs.cc && slugs.cc !== place.cc) {
        notes.push(
          `place #${id} (${slugs.en}) moved from ${slugs.cc} to ${place.cc} — the country part of its URLs changes, so the old URLs will 404`
        );
      }
    } else if (!held.has(slugs)) {
      notes.push(`place #${id} (${slugs.en}) was removed — its published URLs will now 404`);
    }
  }
  return notes;
}

/**
 * GeoNames occasionally re-issues a place under a new id. When exactly one new
 * place in the same country would have been published under a vanished id's
 * slug, it takes over all of that id's slugs (every language, not just the one
 * that matched), so none of its URLs change. Returns id → slugs for the current
 * places, `previous` plus the adoptions.
 *
 * The result doesn't depend on the order of `places` or `previous`: vanished ids
 * left with a single possible new place adopt it, which may settle others in
 * turn ("portland-maine" takes Portland, Maine, leaving Portland, Oregon as the
 * only match for "portland"). Several vanished ids left with the same single new
 * place go to the one whose slug names the place's region, else to none.
 *
 * @param {Array<{ id: number, cc: string, en: string, cs: string, a1?: { en: string, cs?: string } }>} places
 * @param {Map<number, { en: string, cs: string, cc?: string }>} previous
 * @param {string[]} notes
 */
function adoptReissuedIds(places, previous, notes) {
  const published = new Map(previous);
  const current = new Set(places.map((p) => p.id));
  const newcomers = new Map(places.filter((p) => !previous.has(p.id)).map((p) => [p.id, p]));
  // Slugs a place could have been published under: plain or region-suffixed.
  const forms = new Map(
    [...newcomers.values()].map((place) => {
      const natural = naturalSlug(place, "en");
      const regions = [place.a1?.en, place.a1?.cs].map((r) => slugify(r ?? "")).filter(Boolean);
      return [place.id, { natural, suffixed: regions.map((r) => `${natural}-${r}`) }];
    })
  );

  // Vanished id → (new place id → whether the slug names its region too).
  const open = new Map();
  for (const [id, slugs] of previous) {
    if (current.has(id) || !slugs.cc) continue;
    const candidates = new Map();
    for (const place of newcomers.values()) {
      if (place.cc !== slugs.cc) continue;
      const { natural, suffixed } = forms.get(place.id);
      if (suffixed.includes(slugs.en)) candidates.set(place.id, true);
      else if (natural === slugs.en) candidates.set(place.id, false);
    }
    if (candidates.size) open.set(id, candidates);
  }

  const claimed = new Set(); // new places that adopted an id or were contested
  const left = (id) => [...open.get(id).keys()].filter((n) => !claimed.has(n));
  for (;;) {
    // New place → the vanished ids for which it is the only candidate left.
    const forced = new Map();
    for (const id of open.keys()) {
      const rest = left(id);
      if (rest.length === 1) forced.set(rest[0], [...(forced.get(rest[0]) ?? []), id]);
    }
    if (!forced.size) break;
    for (const [n, ids] of forced) {
      const specific = ids.filter((id) => open.get(id).get(n));
      const winner = ids.length === 1 ? ids[0] : specific.length === 1 ? specific[0] : null;
      const place = newcomers.get(n);
      claimed.add(n);
      if (winner === null) {
        notes.push(`places ${ids.map((id) => `#${id} (${previous.get(id).en})`).join(", ")} may all be #${n} "${place.en}" — ambiguous, not carried over`);
      } else {
        const slugs = previous.get(winner);
        published.set(n, slugs);
        notes.push(`place #${winner} (${slugs.en}) is now #${n} "${place.en}" — kept its URLs, check it is the same place`);
      }
      for (const id of ids) open.delete(id);
    }
  }
  for (const id of open.keys()) {
    const rest = left(id);
    if (rest.length > 1) {
      notes.push(`place #${id} (${previous.get(id).en}) may be one of ${rest.map((n) => `#${n}`).join(", ")} — ambiguous, not carried over`);
    }
  }
  return published;
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
      const natural = slugify(country[locale]) || slugify(country.en ?? "") || cc.toLowerCase();
      const slug = old ?? natural;
      if (old && old !== natural) {
        notes.push(`kept country slug ${locale}:${old} although the name is now "${country[locale]}"`);
      }
      if (owner.has(slug)) throw new Error(`Country slug ${locale}:${slug} used by ${owner.get(slug)} and ${cc}`);
      owner.set(slug, cc);
      country.slug[locale] = assertSlug(slug, `country ${cc} (${locale})`);
    }
  }
  for (const [cc, slugs] of previous) {
    if (!(cc in countries)) notes.push(`country ${cc} (${slugs.en}) has no places any more — its hub URLs will now 404`);
  }
  return notes;
}
