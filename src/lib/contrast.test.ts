import { describe, expect, it } from "vitest";
import { contrastRatio, textOn } from "@/lib/contrast";
import { AQI_COLORS, POLLEN_COLORS, UNRATED_COLOR } from "@/lib/air";
import { UV_COLORS } from "@/lib/meteo";

describe("textOn", () => {
  it("puts dark text on light colours and white text on dark ones", () => {
    expect(textOn("#eab308")).toBe("#0f172a");
    expect(textOn("#9333ea")).toBe("#ffffff");
  });

  it("keeps every level badge readable (WCAG AA, 4.5:1)", () => {
    const fills = [...AQI_COLORS, ...POLLEN_COLORS, ...UV_COLORS, UNRATED_COLOR, "#10b981", "#84cc16", "#94a3b8"];
    for (const fill of fills) {
      expect(contrastRatio(fill, textOn(fill)), fill).toBeGreaterThanOrEqual(4.5);
    }
  });
});
