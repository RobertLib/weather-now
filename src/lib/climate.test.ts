import { describe, expect, it } from "vitest";
import { monthComfort } from "@/lib/climate";

describe("monthComfort", () => {
  it("caps estimated wet days at a plausible maximum", () => {
    const monsoon = { hi: 24, lo: 20, p: 840 };
    const veryWet = { hi: 24, lo: 20, p: 28 * 9 };
    expect(monthComfort(monsoon)).toBe(monthComfort(veryWet));
  });

  it("prefers measured rain days when the source has them", () => {
    expect(monthComfort({ hi: 23, lo: 14, p: 840, pd: 2 })).toBeGreaterThan(
      monthComfort({ hi: 23, lo: 14, p: 840 })
    );
  });
});
