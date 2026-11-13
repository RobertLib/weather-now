import { describe, expect, it } from "vitest";
import { formatTemp, formatTempDelta, signed } from "@/lib/units";

describe("signed", () => {
  it("uses a real minus sign and never prints -0", () => {
    expect(signed(-3)).toBe("−3");
    expect(signed(5)).toBe("5");
    expect(signed(-0)).toBe("0");
    expect(signed(Math.round(-0.4))).toBe("0");
  });
});

describe("formatTemp", () => {
  it("formats negative temperatures with a minus sign in both unit systems", () => {
    expect(formatTemp(-2.6, "metric")).toBe("−3°");
    expect(formatTemp(-20, "imperial")).toBe("−4°");
    expect(formatTemp(21.4, "metric")).toBe("21°");
  });

  it("converts a difference without the 32° offset", () => {
    expect(formatTempDelta(10, "imperial")).toBe("18°");
  });
});
