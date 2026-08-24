import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication.
const PROTECTED_ROUTES = [
  "/dashboard",
  "/upload",
  "/results",
  "/favorites",
  "/wardrobe",
  "/stylist",
  "/compare",
  "/history",
  "/trending",
  "/settings",
  "/analysis",
];

// API routes that require authentication (checked server-side, but middleware
// can pre-filter to avoid unnecessary server execution).
const PROTECTED_API_ROUTES = [
  "/api/analysis",
  "/api/favorites",
  "/api/stylist",
  "/api/uploads",
  "/api/user",
  "/api/dashboard",
  "/api/wardrobe",
];

// Routes that should never be middleware-processed (static assets, Next.js internals).
const SKIP_ROUTES = ["/_next", "/favicon.ico", "/api/auth"];

function isProtectedRoute(pathname: string): boolean {
  // Skip Next.js internals and auth endpoints
  if (SKIP_ROUTES.some((r) => pathname.startsWith(r))) return false;

  // Check API routes
  if (PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))) return true;

  // Check page routes — match exact or nested (e.g. /results/abc)
  if (PROTECTED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return true;
  }

  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  // Better Auth uses cookies with prefix "suitora". Check for any cookie
  // that starts with "suitora." — the session token cookie will be there.
  const cookieHeader = request.headers.get("cookie") || "";
  // Parse cookie names from the header string
  const cookiePairs = cookieHeader.split(";");
  for (const pair of cookiePairs) {
    const name = pair.trim().split("=")[0];
    if (name.startsWith("suitora.")) {
      return true;
    }
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // For page routes, check session cookie presence and redirect if missing.
  // For API routes, let the server-side requireUser() handle 401 — middleware
  // only does a fast pre-check to avoid running server code for obviously
  // unauthenticated requests.
  const isApiRoute = pathname.startsWith("/api/");

  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    // Let the API route's requireUser() return a proper 401 JSON response.
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login, preserving the intended URL.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
