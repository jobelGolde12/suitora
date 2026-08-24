import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import proxy from "@/proxy";

function req(
  pathname: string,
  opts: { method?: string; cookie?: string } = {}
): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    method: opts.method ?? "GET",
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  });
}

describe("proxy route protection", () => {
  it("redirects unauthenticated page requests to /login", async () => {
    const res = await proxy(req("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("returns a JSON 401 for private API routes without a session cookie", async () => {
    // Contract: API clients get JSON, never an HTML login redirect.
    const res = await proxy(req("/api/favorites"));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/unauthorized/i);
  });

  it("passes public and self-authing API routes through", async () => {
    for (const path of [
      "/api/trending",
      "/api/health",
      "/api/auth/sign-in",
      "/api/tryon/webhook",
    ]) {
      const res = await proxy(req(path));
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("lets page requests pass when a session cookie is present", async () => {
    const res = await proxy(req("/favorites", { cookie: "suitora.session_token=tok" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users away from auth pages", async () => {
    const res = await proxy(req("/login", { cookie: "suitora.session_token=tok" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("tags every response with a correlation ID", async () => {
    for (const path of ["/dashboard", "/api/favorites"]) {
      const res = await proxy(req(path));
      const requestId = res.headers.get("X-Request-Id");
      expect(requestId).toMatch(/^[A-Za-z0-9-]{8,64}$/);
    }
  });
});
