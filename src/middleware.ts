import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/pricing",
];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/webhooks",
  "/api/genkit",
];

// Static file extensions to skip
const STATIC_EXTENSIONS = [
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".css",
  ".js",
  ".map",
  ".woff",
  ".woff2",
  ".ttf",
];

function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // Prefix match for public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) return true;

  // Skip Next.js internals and static files
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;

  // Skip static file extensions
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for the Firebase auth session cookie
  // This cookie is set client-side after successful Firebase Auth login
  const authToken = request.cookies.get("__session")?.value;

  if (!authToken) {
    // No auth token found — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — allow request through
  // Full token verification happens client-side via Firebase Auth SDK
  // For server-side verification, Firebase Admin SDK would be needed
  // but middleware runs on the Edge runtime which has limited Node.js APIs
  return NextResponse.next();
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
