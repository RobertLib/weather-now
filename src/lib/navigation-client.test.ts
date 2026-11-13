import { describe, expect, it } from "vitest";
import { placeFromQuery } from "@/lib/navigation-client";

const parse = (query: string) => placeFromQuery(new URLSearchParams(query));

describe("placeFromQuery", () => {
  it("reads coordinates, name and country code", () => {
    expect(parse("lat=50.08&lon=14.42&name=Zbraslav&cc=cz")).toEqual({ lat: 50.08, lon: 14.42, name: "Zbraslav", cc: "CZ" });
  });

  it("rejects missing, empty and out-of-range coordinates", () => {
    expect(parse("lat=50")).toBeNull();
    expect(parse("lat=&lon=")).toBeNull();
    expect(parse("lat=91&lon=0")).toBeNull();
    expect(parse("lat=0&lon=-181")).toBeNull();
    expect(parse("lat=abc&lon=1")).toBeNull();
  });

  it("drops names that look like web addresses", () => {
    expect(parse("lat=1&lon=2&name=Visit evil.example now")?.name).toBeUndefined();
    expect(parse("lat=1&lon=2&name=https://x.y")?.name).toBeUndefined();
    expect(parse("lat=1&lon=2&name=St. Louis")?.name).toBe("St. Louis");
  });

  it("cleans up whitespace and caps long names", () => {
    expect(parse("lat=1&lon=2&name=%20New%0A%20York%20")?.name).toBe("New York");
    expect(parse(`lat=1&lon=2&name=${"a".repeat(200)}`)?.name).toHaveLength(60);
  });

  it("ignores a malformed country code", () => {
    expect(parse("lat=1&lon=2&cc=Czechia")?.cc).toBeUndefined();
  });
});
