"use client";

import { useState, useEffect, useCallback } from "react";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  premiumMaxRequests?: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

interface UseRateLimitReturn {
  canProceed: boolean;
  remaining: number;
  resetTime: Date | null;
  timeUntilReset: number; // seconds
  increment: () => boolean; // Returns true if allowed, false if rate limited
  reset: () => void;
}

const STORAGE_PREFIX = "rateLimit_";

/**
 * Client-side rate limiting hook for AI tools
 * Uses localStorage to persist rate limits across page refreshes
 */
export function useRateLimit(
  key: string,
  config: RateLimitConfig,
  isPremium: boolean = false
): UseRateLimitReturn {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const maxRequests = isPremium && config.premiumMaxRequests 
    ? config.premiumMaxRequests 
    : config.maxRequests;

  const [state, setState] = useState<RateLimitState>(() => {
    if (typeof window === "undefined") {
      return { count: 0, resetTime: Date.now() + config.windowMs };
    }
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if reset time has passed
        if (Date.now() > parsed.resetTime) {
          return { count: 0, resetTime: Date.now() + config.windowMs };
        }
        return parsed;
      }
    } catch {
      // Ignore localStorage errors
    }
    return { count: 0, resetTime: Date.now() + config.windowMs };
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore localStorage errors
    }
  }, [state, storageKey]);

  // Auto-reset when time window expires
  useEffect(() => {
    const now = Date.now();
    if (now > state.resetTime) {
      setState({ count: 0, resetTime: now + config.windowMs });
      return;
    }

    const timeout = setTimeout(() => {
      setState({ count: 0, resetTime: Date.now() + config.windowMs });
    }, state.resetTime - now);

    return () => clearTimeout(timeout);
  }, [state.resetTime, config.windowMs]);

  const canProceed = state.count < maxRequests;
  const remaining = Math.max(0, maxRequests - state.count);
  const timeUntilReset = Math.max(0, Math.ceil((state.resetTime - Date.now()) / 1000));

  const increment = useCallback(() => {
    if (state.count >= maxRequests) {
      return false;
    }
    setState(prev => ({ ...prev, count: prev.count + 1 }));
    return true;
  }, [state.count, maxRequests]);

  const reset = useCallback(() => {
    setState({ count: 0, resetTime: Date.now() + config.windowMs });
  }, [config.windowMs]);

  return {
    canProceed,
    remaining,
    resetTime: new Date(state.resetTime),
    timeUntilReset,
    increment,
    reset,
  };
}

// ============================================
// PREDEFINED AI TOOL RATE LIMITS
// ============================================

export const AI_RATE_LIMITS = {
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

/**
 * Format time until reset as a readable string
 */
export function formatTimeUntilReset(seconds: number): string {
  if (seconds <= 0) return "now";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
