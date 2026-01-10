/**
 * Safe Error Handler
 * Provides consistent error responses without leaking internal details
 */

import { NextResponse } from "next/server";

// ===========================
// ERROR TYPES
// ===========================

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMITED = "RATE_LIMITED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CSRF_ERROR = "CSRF_ERROR",
  
  // Server Errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

interface ApiError {
  code: ErrorCode;
  message: string;
  status: number;
}

// ===========================
// ERROR DEFINITIONS
// ===========================

const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ApiError, "code">> = {
  [ErrorCode.BAD_REQUEST]: {
    message: "Invalid request. Please check your input.",
    status: 400,
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: "Please log in to access this resource.",
    status: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    message: "You don't have permission to access this resource.",
    status: 403,
  },
  [ErrorCode.NOT_FOUND]: {
    message: "The requested resource was not found.",
    status: 404,
  },
  [ErrorCode.RATE_LIMITED]: {
    message: "Too many requests. Please try again later.",
    status: 429,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    message: "Validation failed. Please check your input.",
    status: 422,
  },
  [ErrorCode.CSRF_ERROR]: {
    message: "Security validation failed. Please refresh and try again.",
    status: 403,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    message: "Something went wrong. Please try again later.",
    status: 500,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    message: "Service temporarily unavailable. Please try again later.",
    status: 503,
  },
  [ErrorCode.DATABASE_ERROR]: {
    message: "Unable to process your request. Please try again.",
    status: 500,
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    message: "An external service is currently unavailable. Please try again.",
    status: 502,
  },
};

// ===========================
// ERROR RESPONSE HELPERS
// ===========================

/**
 * Create a safe error response that doesn't leak internal details
 */
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, string>
): NextResponse {
  const errorDef = ERROR_DEFINITIONS[code];
  
  const responseBody: Record<string, any> = {
    error: {
      code,
      message: customMessage || errorDef.message,
    },
  };
  
  // Only include validation details, never internal errors
  if (details && code === ErrorCode.VALIDATION_ERROR) {
    responseBody.error.details = details;
  }
  
  return NextResponse.json(responseBody, { status: errorDef.status });
}

/**
 * Log error internally but return safe response
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse {
  // Log the full error internally
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[API Error${context ? ` - ${context}` : ""}]:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });
  
  // Determine error type and return safe response
  if (error instanceof Error) {
    // Check for specific error types
    if (errorMessage.includes("not found") || errorMessage.includes("NOT_FOUND")) {
      return createErrorResponse(ErrorCode.NOT_FOUND);
    }
    
    if (errorMessage.includes("unauthorized") || errorMessage.includes("auth")) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED);
    }
    
    if (errorMessage.includes("permission") || errorMessage.includes("forbidden")) {
      return createErrorResponse(ErrorCode.FORBIDDEN);
    }
    
    if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
      return createErrorResponse(ErrorCode.RATE_LIMITED);
    }
    
    // Database errors
    if (
      errorMessage.includes("firestore") ||
      errorMessage.includes("database") ||
      errorMessage.includes("DEADLINE_EXCEEDED")
    ) {
      return createErrorResponse(ErrorCode.DATABASE_ERROR);
    }
    
    // External service errors (Stripe, Cloudinary, etc.)
    if (
      errorMessage.includes("stripe") ||
      errorMessage.includes("cloudinary") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return createErrorResponse(ErrorCode.EXTERNAL_SERVICE_ERROR);
    }
  }
  
  // Default to internal error
  return createErrorResponse(ErrorCode.INTERNAL_ERROR);
}

/**
 * Wrapper for async API handlers with automatic error handling
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>,
  context?: string
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}
