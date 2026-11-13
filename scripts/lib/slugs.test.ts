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
