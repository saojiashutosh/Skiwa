import { describe, expect, it } from "vitest";

import { cn, formatINR, sumDecimals } from "@/lib/utils";

describe("formatINR", () => {
  it("formats whole rupees without decimals", () => {
    expect(formatINR(1499)).toBe("₹1,499");
  });

  it("uses the Indian digit grouping", () => {
    expect(formatINR(123456)).toBe("₹1,23,456");
  });

  it("accepts decimal strings", () => {
    expect(formatINR("2999.00")).toBe("₹2,999");
  });

  it("keeps paise when present", () => {
    expect(formatINR("149.90")).toBe("₹149.90");
  });

  it("handles garbage gracefully", () => {
    expect(formatINR("not-a-number")).toBe("₹0");
  });
});

describe("sumDecimals", () => {
  it("sums decimal strings without float drift", () => {
    expect(sumDecimals(["0.1", "0.2"])).toBe(0.3);
  });

  it("sums mixed inputs", () => {
    expect(sumDecimals([1499, "1499.00", "99.50"])).toBe(3097.5);
  });

  it("returns 0 for an empty list", () => {
    expect(sumDecimals([])).toBe(0);
  });
});

describe("cn", () => {
  it("merges tailwind classes with later overrides", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
