import { describe, it, expect } from "vitest";
import { mapCategoryToTryOn } from "./category";

describe("mapCategoryToTryOn", () => {
  it("maps dresses and formal to dresses", () => {
    expect(mapCategoryToTryOn("dresses")).toBe("dresses");
    expect(mapCategoryToTryOn("formal")).toBe("dresses");
  });

  it("maps upper-body categories to upper_body", () => {
    expect(mapCategoryToTryOn("tops")).toBe("upper_body");
    expect(mapCategoryToTryOn("outerwear")).toBe("upper_body");
    expect(mapCategoryToTryOn("activewear")).toBe("upper_body");
  });

  it("maps bottoms and footwear to lower_body", () => {
    expect(mapCategoryToTryOn("bottoms")).toBe("lower_body");
    expect(mapCategoryToTryOn("footwear")).toBe("lower_body");
  });

  it("passes through raw VTON zones unchanged", () => {
    expect(mapCategoryToTryOn("upper_body")).toBe("upper_body");
    expect(mapCategoryToTryOn("lower_body")).toBe("lower_body");
    expect(mapCategoryToTryOn("dresses")).toBe("dresses");
  });

  it("falls back to upper_body for unknown or missing categories", () => {
    expect(mapCategoryToTryOn("mystery")).toBe("upper_body");
    expect(mapCategoryToTryOn(undefined)).toBe("upper_body");
  });
});
