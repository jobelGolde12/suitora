import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { globalIpLimiter, getClientIp } from "@/lib/rate-limit";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS preflight — only honored for allow-listed origins.
  if (request.method === "OPTIONS") {
    if (isTrustedOrigin(request)) {
      const res = new NextResponse(null, { status: 204 });
      return setCorsHeaders(request, res);
    }
    return new NextResponse(null, { status: 403 });
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
      return setCorsHeaders(request, res);
    }
  }

  // Centralize API gating: private /api routes without a session cookie → 401.
  if (pathname.startsWith("/api")) {
    const isSelfAuthing = selfAuthingApiPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isSelfAuthing && !hasSessionCookie(request)) {
      return setCorsHeaders(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    return setCorsHeaders(
      request,
      NextResponse.redirect(new URL("/dashboard", request.url))
    );
  }

  // Redirect unauthenticated users to login for protected routes
  if (!pathname.startsWith("/api") && !isPublicRoute && !isAuthenticated) {
    return setCorsHeaders(
      request,
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  return setCorsHeaders(request, NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt / sitemap.xml (SEO files)
     * - static assets served from /public (images, icons)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|public/).*)",
  ],
};

