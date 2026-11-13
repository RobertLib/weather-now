import { describe, expect, it } from "vitest";
import { assignCountrySlugs, assignPlaceSlugs, slugify } from "./slugs.mjs";

type Input = { id: number; cc: string; en: string; cs: string; a1?: { en: string; cs?: string }; slug?: Record<string, string> };

const place = (id: number, en: string, cs = en, a1?: string): Input => ({
  id,
  cc: "US",
  en,
  cs,
  ...(a1 ? { a1: { en: a1 } } : {}),
});

describe("slugify", () => {
  it("folds accents and special letters", () => {
    expect(slugify("České Budějovice")).toBe("ceske-budejovice");
    expect(slugify("Łódź")).toBe("lodz");
    expect(slugify("Frýdek-Místek")).toBe("frydek-mistek");
  });

  it("splits ligatures and digraphs", () => {
    expect(slugify("ﬁord ǅakovo")).toBe("fiord-dzakovo");
  });

  it("folds letters that decompose into a special letter", () => {
    expect(slugify("Ǿresund Ǽble Ǣ ǿ ǽ ǣ")).toBe("oresund-aeble-ae-o-ae-ae");
  });

  it("folds schwa, t with stroke and eng", () => {
    expect(slugify("Gəncə")).toBe("gence");
    expect(slugify("ƏŧŦŋŊ")).toBe("ettnn");
  });

  it("drops apostrophes and the ʻokina without splitting the word", () => {
    expect(slugify("Oʻahu")).toBe("oahu");
    expect(slugify("L’Aquila")).toBe("laquila");
    expect(slugify("Côte d'Azur")).toBe("cote-dazur");
    expect(slugify("S’-čchuan")).toBe("s-cchuan");
  });
});

describe("assignPlaceSlugs", () => {
  it("suffixes new namesakes with their region", () => {
    const places = [place(1, "Springfield", "Springfield", "Illinois"), place(2, "Springfield", "Springfield", "Missouri")];
    assignPlaceSlugs(places, new Map());
    expect(places.map((p) => p.slug!.en)).toEqual(["springfield-illinois", "springfield-missouri"]);
  });

  it("never renames a published place when a namesake is added", () => {
    const places = [place(1, "Portland", "Portland", "Oregon"), place(2, "Portland", "Portland", "Maine")];
    const notes = assignPlaceSlugs(places, new Map([[1, { en: "portland", cs: "portland" }]]));
    expect(places.map((p) => p.slug!.en)).toEqual(["portland", "portland-maine"]);
    expect(notes.some((n) => n.includes("collision"))).toBe(true);
  });

  it("keeps a published slug when the name changes", () => {
    const places = [place(1, "Kyiv", "Kyjev")];
    const notes = assignPlaceSlugs(places, new Map([[1, { en: "kiev", cs: "kyjev" }]]));
    expect(places[0].slug).toEqual({ en: "kiev", cs: "kyjev" });
    expect(notes).toEqual([expect.stringContaining('kept slug en:US/kiev although the name is now "Kyiv"')]);
  });

  it("reports removed places, whose URLs will stop working", () => {
    const notes = assignPlaceSlugs([], new Map([[7, { en: "gone", cs: "gone" }]]));
    expect(notes).toEqual([expect.stringContaining("#7 (gone) was removed")]);
  });

  it("doesn't report a 404 when a re-issued id takes over the same URL", () => {
    const places = [place(8, "Austin")];
    const notes = assignPlaceSlugs(places, new Map([[7, { en: "austin", cs: "austin", cc: "US" }]]));
    expect(places[0].slug).toEqual({ en: "austin", cs: "austin" });
    expect(notes).toEqual([expect.stringContaining("is now #8")]);
  });

  it("carries every language's slug over to a re-issued id, even after a rename", () => {
    const places = [{ id: 8, cc: "DE", en: "Munich", cs: "München" }] as Input[];
    const notes = assignPlaceSlugs(places, new Map([[7, { en: "munich", cs: "mnichov", cc: "DE" }]]));
    expect(places[0].slug).toEqual({ en: "munich", cs: "mnichov" });
    expect(notes.some((n) => n.includes("is now #8"))).toBe(true);
    expect(notes.some((n) => n.includes("404"))).toBe(false);
  });

  it("recognises a re-issued id behind a region-suffixed slug", () => {
    const places = [{ id: 9, cc: "US", en: "Portland", cs: "Portland", a1: { en: "Maine" } }] as Input[];
    assignPlaceSlugs(places, new Map([[3, { en: "portland-maine", cs: "portland-maine", cc: "US" }]]));
    expect(places[0].slug).toEqual({ en: "portland-maine", cs: "portland-maine" });
  });

  it("doesn't guess when several new places could be the re-issued one", () => {
    const places = [place(8, "Austin", "Austin", "Texas"), place(9, "Austin", "Austin", "Minnesota")];
    const notes = assignPlaceSlugs(places, new Map([[7, { en: "austin", cs: "austin", cc: "US" }]]));
    expect(notes.some((n) => n.includes("ambiguous"))).toBe(true);
    expect(notes.some((n) => n.includes("#7 (austin) was removed"))).toBe(true);
  });

  it("matches re-issued namesakes the same way in any order", () => {
    // Both Portlands were re-issued: "portland-maine" can only be Portland, Maine,
    // which leaves Portland, Oregon as the one match for "portland".
    const previous: Array<[number, { en: string; cs: string; cc: string }]> = [
      [1, { en: "portland", cs: "portland-or", cc: "US" }],
      [3, { en: "portland-maine", cs: "portland-me", cc: "US" }],
    ];
    for (const prev of [previous, [...previous].reverse()]) {
      for (const reverse of [false, true]) {
        const places = [place(8, "Portland", "Portland", "Oregon"), place(9, "Portland", "Portland", "Maine")];
        if (reverse) places.reverse();
        const notes = assignPlaceSlugs(places, new Map(prev));
        const slugs = Object.fromEntries(places.map((p) => [p.id, p.slug]));
        expect(slugs).toEqual({
          8: { en: "portland", cs: "portland-or" },
          9: { en: "portland-maine", cs: "portland-me" },
        });
        expect(notes.filter((n) => n.includes("is now #"))).toHaveLength(2);
        expect(notes.some((n) => n.includes("ambiguous") || n.includes("404"))).toBe(false);
      }
    }
  });

  it("gives a contested new place to the vanished slug that names its region", () => {
    const places = [place(9, "Portland", "Portland", "Maine")];
    const notes = assignPlaceSlugs(
      places,
      new Map([
        [1, { en: "portland", cs: "portland", cc: "US" }],
        [3, { en: "portland-maine", cs: "portland-maine", cc: "US" }],
      ])
    );
    expect(places[0].slug).toEqual({ en: "portland-maine", cs: "portland-maine" });
    expect(notes.some((n) => n.includes("#3 (portland-maine) is now #9"))).toBe(true);
    expect(notes.some((n) => n.includes("#1 (portland) was removed"))).toBe(true);
  });

  it("reports a place whose country changed, since its URLs change too", () => {
    const places = [{ id: 5, cc: "RS", en: "Pristina", cs: "Priština" }] as Input[];
    const notes = assignPlaceSlugs(places, new Map([[5, { en: "pristina", cs: "pristina", cc: "XK" }]]));
    expect(places[0].slug).toEqual({ en: "pristina", cs: "pristina" });
    expect(notes).toEqual([expect.stringContaining("moved from XK to RS")]);
  });

  it("falls back to the English name, then the id, for names that fold to nothing", () => {
    const places = [place(1, "Tokyo", "東京"), place(2, "東京", "東京")];
    assignPlaceSlugs(places, new Map());
    expect(places[0].slug).toEqual({ en: "tokyo", cs: "tokyo" });
    expect(places[1].slug).toEqual({ en: "place-2", cs: "place-2" });
  });

  it("suffixes with the id when the region folds to nothing", () => {
    const places = [place(1, "Springfield"), place(2, "Springfield", "Springfield", "東京")];
    assignPlaceSlugs(places, new Map());
    expect(places.map((p) => p.slug!.en)).toEqual(["springfield-1", "springfield-2"]);
  });
});

describe("assignCountrySlugs", () => {
  it("keeps published country slugs when ICU renames a country", () => {
    const countries: Record<string, { en: string; cs: string; slug?: { en: string; cs: string } }> = {
      TR: { en: "Türkiye", cs: "Turecko" },
      NL: { en: "Netherlands", cs: "Nizozemsko" },
    };
    const notes = assignCountrySlugs(countries, new Map([["TR", { en: "turkey", cs: "turecko" }]]));
    expect(countries.TR.slug).toEqual({ en: "turkey", cs: "turecko" });
    expect(countries.NL.slug).toEqual({ en: "netherlands", cs: "nizozemsko" });
    expect(notes).toHaveLength(1);
  });

  it("reports countries that no longer have any places", () => {
    const notes = assignCountrySlugs({}, new Map([["XK", { en: "kosovo", cs: "kosovo" }]]));
    expect(notes).toEqual([expect.stringContaining("country XK (kosovo) has no places")]);
  });
});
