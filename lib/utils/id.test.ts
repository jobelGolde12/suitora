import { describe, it, expect, afterEach } from "vitest";
import { nanoid } from "./id";

describe("nanoid", () => {
  const originalUUID = Object.getOwnPropertyDescriptor(crypto, "randomUUID");

  afterEach(() => {
    if (originalUUID) {
      Object.defineProperty(crypto, "randomUUID", originalUUID);
    } else {
      // @ts-expect-error restoring the original property shape
      delete crypto.randomUUID;
    }
  });

  it("uses crypto.randomUUID when available", () => {
    const id = nanoid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("falls back to the alphanumeric generator when randomUUID is unavailable", () => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    const id = nanoid();
    expect(id).toMatch(/^[A-Za-z0-9]{21}$/);
  });

  it("respects a custom length in the fallback path", () => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    expect(nanoid(8)).toMatch(/^[A-Za-z0-9]{8}$/);
  });
});
