/**
 * Rate Limiting Utility
 * In-memory rate limiter with support for user-based and IP-based limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  premiumMaxRequests?: number; // Higher limit for premium users
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (can be replaced with Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Check and update rate limit for a given identifier
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  isPremium: boolean = false
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const maxRequests = isPremium && config.premiumMaxRequests 
    ? config.premiumMaxRequests 
    : config.maxRequests;
  
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true, remaining: maxRequests - 1, resetTime: now + config.windowMs };
  }
  
  if (existing.count >= maxRequests) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetTime: existing.resetTime };
  }
  
  // Increment count
  existing.count++;
  return { success: true, remaining: maxRequests - existing.count, resetTime: existing.resetTime };
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
  isPremium: boolean = false
): { remaining: number; resetTime: number; isLimited: boolean } {
  const now = Date.now();
  const maxRequests = isPremium && config.premiumMaxRequests 
    ? config.premiumMaxRequests 
    : config.maxRequests;
  
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    return { remaining: maxRequests, resetTime: now + config.windowMs, isLimited: false };
  }
  
  return {
    remaining: Math.max(0, maxRequests - existing.count),
    resetTime: existing.resetTime,
    isLimited: existing.count >= maxRequests,
  };
}

/**
 * Reset rate limit for a specific identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// ============================================
// PREDEFINED RATE LIMIT CONFIGURATIONS
// ============================================

export const RATE_LIMITS = {
  // API Routes
  checkout: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  upload: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  applicationStatus: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  webhook: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  
  // AI Tools (per hour)
  resumeBuilder: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    premiumMaxRequests: 20,
  },
  coverLetter: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 20,
  },
  interviewPrep: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 50,
  },
  linkedinOptimizer: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 20,
  },
  salaryNegotiation: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 20,
  },
  skillGap: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 20,
  },
  emailTemplates: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    premiumMaxRequests: 50,
  },
} as const;

// ============================================
// HELPER FOR NEXT.JS API ROUTES
// ============================================

import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting middleware for API routes
 * @returns null if rate limit check passes, or a NextResponse if rate limited
 */
export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): NextResponse | null {
  // Use user ID if available, otherwise use IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const identifier = userId ? `user:${userId}` : `ip:${ip}`;
  
  const result = checkRateLimit(identifier, config);
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetTime),
        },
      }
    );
  }
  
  return null; // Rate limit check passed
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(resetTime));
  return response;
}
