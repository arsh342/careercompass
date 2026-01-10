/**
 * CSRF Protection Utilities
 * Provides token generation and validation for protecting state-changing operations
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_TOKEN_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface TokenData {
  token: string;
  createdAt: number;
}

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Set CSRF token in cookies (for use in API routes that need to issue tokens)
 */
export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, JSON.stringify({
    token,
    createdAt: Date.now(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_EXPIRY_MS / 1000,
    path: "/",
  });
  
  return token;
}

/**
 * Validate CSRF token from request
 * Returns null if valid, or an error response if invalid
 */
export async function validateCsrfToken(
  request: NextRequest
): Promise<NextResponse | null> {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  // Get token from cookie
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (!headerToken || !cookieValue) {
    return NextResponse.json(
      { error: "CSRF token missing" },
      { status: 403 }
    );
  }
  
  try {
    const tokenData: TokenData = JSON.parse(cookieValue);
    
    // Check if token has expired
    if (Date.now() - tokenData.createdAt > TOKEN_EXPIRY_MS) {
      return NextResponse.json(
        { error: "CSRF token expired" },
        { status: 403 }
      );
    }
    
    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(tokenData.token)
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: "CSRF token invalid" },
        { status: 403 }
      );
    }
    
    return null; // Token is valid
  } catch {
    return NextResponse.json(
      { error: "CSRF token validation failed" },
      { status: 403 }
    );
  }
}

/**
 * Get CSRF token for client-side use
 * This should only be called from a secure context
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (!cookieValue) {
    return null;
  }
  
  try {
    const tokenData: TokenData = JSON.parse(cookieValue);
    
    // Return null if expired
    if (Date.now() - tokenData.createdAt > TOKEN_EXPIRY_MS) {
      return null;
    }
    
    return tokenData.token;
  } catch {
    return null;
  }
}

/**
 * Middleware helper to check CSRF for specific methods
 * Only POST, PUT, DELETE, PATCH need CSRF protection
 */
export function needsCsrfProtection(method: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());
}

/**
 * Origin validation - additional protection against CSRF
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  
  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  
  // In production, origin must match host
  if (!origin || !host) {
    return false;
  }
  
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
