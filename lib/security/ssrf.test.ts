import { describe, it, expect } from "vitest";
import { isPrivateIp, assertSafeHttpUrl, UnsafeUrlError } from "./ssrf";

describe("isPrivateIp", () => {
  it("flags loopback and private IPv4", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.5")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
  });

  it("allows public IPv4", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("142.250.72.14")).toBe(false);
  });

  it("flags loopback and link-local IPv6", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("::")).toBe(true);
    expect(isPrivateIp("fd00::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
  });
});

describe("assertSafeHttpUrl", () => {
  it("accepts a public https URL", async () => {
    await expect(
      assertSafeHttpUrl("https://www.example.com/product")
    ).resolves.toBe("https://www.example.com/product");
  });

  it("rejects localhost", async () => {
    await expect(assertSafeHttpUrl("http://localhost:3000/x")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
  });

  it("rejects private literal IPs", async () => {
    await expect(assertSafeHttpUrl("http://127.0.0.1:80/x")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    await expect(assertSafeHttpUrl("http://192.168.1.1/x")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
  });

  it("rejects non-http schemes and credentials", async () => {
    await expect(assertSafeHttpUrl("file:///etc/passwd")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    await expect(
      assertSafeHttpUrl("https://user:pass@example.com/x")
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects non-string input", async () => {
    await expect(assertSafeHttpUrl(123 as unknown)).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
  });
});
