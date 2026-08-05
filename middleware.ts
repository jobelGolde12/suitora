import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/privacy-policy",
  "/terms-of-service",
  "/",
];

// API routes that don't require authentication
const publicApiRoutes = ["/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a public API route
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is a public page route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // Check for session token - Better Auth uses various cookie names
  const cookies = request.cookies;
  const isAuthenticated = cookies.has("suitora.session_token") ||
    cookies.has("__Secure-suitora.session_token") ||
    cookies.has("better-auth.session_token") ||
    cookies.has("__Secure-better-auth.session_token") ||
    [...cookies.getAll()].some((c) => c.name.includes("session_token"));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!pathname.startsWith("/api") && !isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
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
