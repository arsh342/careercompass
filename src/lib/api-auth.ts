/**
 * API Authentication Middleware
 * Validates Firebase ID tokens for protected API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Verify Firebase ID token from request headers
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("__session")?.value;

    // Extract token from "Bearer <token>"
    const token = authHeader
      ? authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader
      : cookieToken;

    if (!token) {
      return {
        authenticated: false,
        error: "No token provided",
      };
    }

    // Verify with Firebase Admin
    if (!adminAuth) {
      return {
        authenticated: false,
        error: "Authentication service unavailable",
      };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    };
  } catch (error: any) {
    console.error("Token verification failed:", error.message);
    return {
      authenticated: false,
      error: "Invalid or expired token",
    };
  }
}

export async function getUserRole(uid: string): Promise<string | null> {
  if (!adminDb) {
    return null;
  }

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return null;
  }

  const userData = userDoc.data() as Record<string, any>;
  return typeof userData.role === "string" ? userData.role : null;
}

export async function requireRole(
  request: NextRequest,
  roles: string | string[]
): Promise<{ response: NextResponse | null; user?: AuthenticatedUser; role?: string }> {
  const { response, user } = await requireAuth(request);
  if (response || !user) {
    return { response };
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const role = await getUserRole(user.uid);

  if (!role || !allowedRoles.includes(role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { response: null, user, role };
}

/**
 * Middleware to require authentication
 * Returns error response if not authenticated, null if authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ response: NextResponse | null; user?: AuthenticatedUser }> {
  const result = await verifyAuthToken(request);
  
  if (!result.authenticated) {
    return {
      response: NextResponse.json(
        { error: result.error || "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  
  return { response: null, user: result.user };
}

/**
 * Validate request body against a schema
 */
export function validateBody<T extends Record<string, any>>(
  body: T,
  requiredFields: (keyof T)[],
  fieldValidators?: Partial<Record<keyof T, (value: any) => boolean>>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      errors.push(`Missing required field: ${String(field)}`);
    }
  }
  
  // Run custom validators
  if (fieldValidators) {
    for (const [field, validator] of Object.entries(fieldValidators)) {
      if (body[field] !== undefined && validator && !validator(body[field])) {
        errors.push(`Invalid value for field: ${field}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Common field validators
 */
export const validators = {
  isEmail: (value: string): boolean => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  isNonEmptyString: (value: any): boolean => 
    typeof value === "string" && value.trim().length > 0,
  
  isPositiveNumber: (value: any): boolean => 
    typeof value === "number" && value > 0,
  
  isArray: (value: any): boolean => 
    Array.isArray(value),
  
  isNonEmptyArray: (value: any): boolean => 
    Array.isArray(value) && value.length > 0,
  
  maxLength: (max: number) => (value: string): boolean => 
    typeof value === "string" && value.length <= max,
  
  minLength: (min: number) => (value: string): boolean => 
    typeof value === "string" && value.length >= min,
  
  isOneOf: <T>(options: T[]) => (value: T): boolean => 
    options.includes(value),
};

/**
 * Create validation error response
 */
export function validationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}
