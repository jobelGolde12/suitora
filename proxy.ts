import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { globalIpLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Request proxy (formerly middleware).
 *
 * Next.js 16 runs `proxy.ts` on the Node.js runtime, which lets us rewrite the
 * incoming request headers so the correlation ID generated here reaches every
 * route handler and log line (Pillar 04, Action Item 3).
 */

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/privacy-policy",
  "/terms-of-service",
  "/",
];

// API prefixes that manage their own authentication inside the route handler
// (or are public feed endpoints). Everything else under /api is gated here so
// unauthenticated calls get a 401 before reaching a handler. Note: cookie
// presence is a fast pre-filter only — each handler still verifies the session
// server-side via `getSession`/`requireUser`.
const selfAuthingApiPrefixes = [
  "/api/auth", // Better Auth endpoints (sign-in, sign-up, callbacks)
  "/api/tryon/webhook", // constant-time shared-secret check
  "/api/trending", // public feed; /similar and /sync self-auth internally
  "/api/uploads/cleanup", // cron-or-session guarded internally
  "/api/backup", // cron-or-session guarded internally
  "/api/health", // public liveness probe for LB + synthetic health-check
];

function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies;
  return (
    cookies.has("suitora.session_token") ||
    cookies.has("__Secure-suitora.session_token") ||
    cookies.has("better-auth.session_token") ||
    cookies.has("__Secure-better-auth.session_token") ||
    [...cookies.getAll()].some((c) => c.name.includes("session_token"))
  );
}

function corsOrigins(): string[] {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return corsOrigins().includes(origin);
}

function setCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  if (isTrustedOrigin(request)) {
    response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin")!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

/**
 * Correlation ID: accept an upstream `X-Request-Id` only when it looks sane,
 * otherwise generate a fresh UUID. The ID is echoed on the response and
 * injected into the request headers so downstream handlers log with it.
 */
function getOrCreateRequestId(request: NextRequest): string {
  const incoming = request.headers.get("x-request-id");
  if (incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming)) {
    return incoming;
  }
  return crypto.randomUUID();
}

function tagResponse(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("X-Request-Id", requestId);
  return response;
}

/** Pass-through with the correlation ID injected into the request headers. */
function nextWithCorrelation(request: NextRequest, requestId: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  return tagResponse(response, requestId);
}

export default async function proxy(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const { pathname } = request.nextUrl;

  // CORS preflight — only honored for allow-listed origins.
  if (request.method === "OPTIONS") {
    if (isTrustedOrigin(request)) {
      const res = new NextResponse(null, { status: 204 });
      return tagResponse(setCorsHeaders(request, res), requestId);
    }
    return tagResponse(new NextResponse(null, { status: 403 }), requestId);
  }

  // Global per-IP cap on all API traffic (100 req/min/IP). Covers public
  // endpoints (trending feed, auth, webhook) that have no per-route limiter.
  if (pathname.startsWith("/api")) {
    const rl = await globalIpLimiter.limit(getClientIp(request));
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      const res = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfter));
      return tagResponse(setCorsHeaders(request, res), requestId);
    }
  }

  // Centralize API gating: private /api routes without a session cookie → 401.
  if (pathname.startsWith("/api")) {
    const isSelfAuthing = selfAuthingApiPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isSelfAuthing && !hasSessionCookie(request)) {
      return tagResponse(
        setCorsHeaders(
          request,
          NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        ),
        requestId
      );
    }
  }

  // Check if the route is a public page route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  const isAuthenticated = hasSessionCookie(request);

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicRoute && pathname !== "/") {
    return tagResponse(
      setCorsHeaders(
        request,
        NextResponse.redirect(new URL("/dashboard", request.url))
      ),
      requestId
    );
  }

  // Redirect unauthenticated users to login for protected routes
  if (!pathname.startsWith("/api") && !isPublicRoute && !isAuthenticated) {
    return tagResponse(
      setCorsHeaders(
        request,
        NextResponse.redirect(new URL("/login", request.url))
      ),
      requestId
    );
  }

  return tagResponse(
    setCorsHeaders(request, nextWithCorrelation(request, requestId)),
    requestId
  );
}

export const config = {
  matcher: [
    // `/metrics` is excluded: Prometheus scrapes the web tier directly on the
    // internal Docker network (nginx blocks it publicly), and the app-level
    // /metrics route must not be redirected to login by the page gate.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|metrics|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|public/).*)",
  ],
};
