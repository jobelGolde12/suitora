import { describe, it, expect } from "vitest";
import { validateTryOnRequest } from "./validation";

describe("validateTryOnRequest", () => {
  it("accepts a well-formed request", () => {
    const result = validateTryOnRequest({
      personImageUrl: "https://cdn.test/person.jpg",
      garmentImageUrl: "https://cdn.test/garment.jpg",
      category: "dresses",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing or non-http person URLs", () => {
    const result = validateTryOnRequest({
      personImageUrl: "not-a-url",
      garmentImageUrl: "https://cdn.test/garment.jpg",
      category: "upper_body",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("personImageUrl");
  });

  it("rejects missing garment URLs", () => {
    const result = validateTryOnRequest({
      personImageUrl: "https://cdn.test/person.jpg",
      garmentImageUrl: "",
      category: "upper_body",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("garmentImageUrl");
  });

  it("rejects unknown categories", () => {
    const result = validateTryOnRequest({
      personImageUrl: "https://cdn.test/person.jpg",
      garmentImageUrl: "https://cdn.test/garment.jpg",
      category: "hats" as "upper_body",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("category");
  });
});
