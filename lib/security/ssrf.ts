import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard for user-supplied URLs.
 *
 * Blocks requests to loopback, private, link-local, and reserved IP ranges
 * (and obvious internal hostnames). Run BEFORE any outbound fetch of a
 * user-provided URL so a malicious client cannot pivot the server into its
 * internal network.
 */

const BLOCKED_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".lan",
];

export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 0) return false;

  if (family === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    // Loopback 127/8
    if (a === 127) return true;
    // RFC1918
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    // Link-local 169.254/16
    if (a === 169 && b === 254) return true;
    // Carrier-grade NAT 100.64/10
    if (a === 100 && b >= 64 && b <= 127) return true;
    // Benchmarking / documentation ranges
    if (a === 192 && b === 0) return true; // 192.0.0/24 + 192.0.2/24
    if (a === 192 && b === 0 && parts[2] === 2) return true;
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15
    if (a === 198 && b === 51 && parts[2] === 100) return true; // 198.51.100/24
    if (a === 203 && b === 0 && parts[2] === 113) return true; // 203.0.113/24
    // Multicast + reserved
    if (a >= 224) return true;
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  const first = lower.split(":")[0];
  // Loopback ::1 and unspecified ::
  if (lower === "::1" || lower === "::") return true;
  // Unique-local fc00::/7 and link-local fe80::/10
  if (first.startsWith("fc") || first.startsWith("fd")) return true;
  if (first.startsWith("fe")) {
    const fl = first.slice(2, 4);
    if (fl === "80" || fl === "81" || fl === "82" || fl === "83") return true;
  }
  // Multicast ff00::/8
  if (first === "ff" || first.startsWith("ff")) return true;
  return false;
}

export class UnsafeUrlError extends Error {}

/**
 * Validates that `value` is a public http(s) URL and resolves to a non-private
 * IP. Returns the normalized URL string on success, otherwise throws
 * `UnsafeUrlError`.
 */
export async function assertSafeHttpUrl(value: unknown): Promise<string> {
  if (typeof value !== "string") {
    throw new UnsafeUrlError("URL must be a string");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeUrlError("URL must use http or https");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError("URL must not contain credentials");
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new UnsafeUrlError("URL must not target localhost");
  }
  if (BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UnsafeUrlError("URL must not target an internal hostname");
  }

  const numeric = isIP(host);
  if (numeric === 4 || numeric === 6) {
    if (isPrivateIp(host)) {
      throw new UnsafeUrlError("URL must not target a private address");
    }
    return value;
  }

  // Resolve DNS and reject if any A/AAAA record is private.
  try {
    const records = await lookup(host, { all: true });
    for (const { address } of records) {
      if (isPrivateIp(address)) {
        throw new UnsafeUrlError("URL resolves to a private address");
      }
    }
  } catch (err) {
    if (err instanceof UnsafeUrlError) throw err;
    throw new UnsafeUrlError("URL could not be resolved");
  }

  return value;
}
