/**
 * Session & Authentication Validation Utilities
 * Provides utilities for validating user sessions and protecting routes
 */

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// ===========================
// SESSION VALIDATION
// ===========================

/**
 * Validate that a user session is still valid
 * Firebase tokens auto-refresh, but this provides additional checks
 */
export async function validateSession(): Promise<{
  valid: boolean;
  user: User | null;
  error?: string;
}> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { valid: false, user: null, error: "No active session" };
    }
    
    // Force token refresh to ensure it's still valid
    await user.getIdToken(true);
    
    // Check email verification if required
    // Uncomment if you want to require email verification
    // if (!user.emailVerified) {
    //   return { valid: false, user, error: "Email not verified" };
    // }
    
    return { valid: true, user };
  } catch (error: any) {
    console.error("Session validation failed:", error);
    return { 
      valid: false, 
      user: null, 
      error: "Session expired. Please log in again." 
    };
  }
}

/**
 * Get current user's ID token for API requests
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Check if user session is about to expire
 * Returns minutes until expiry
 */
export async function getSessionTimeRemaining(): Promise<number> {
  try {
    const user = auth.currentUser;
    if (!user) return 0;
    
    const tokenResult = await user.getIdTokenResult();
    const expirationTime = new Date(tokenResult.expirationTime).getTime();
    const now = Date.now();
    
    return Math.max(0, Math.floor((expirationTime - now) / 1000 / 60));
  } catch {
    return 0;
  }
}

/**
 * Setup session monitoring
 * Calls callback when session state changes
 */
export function monitorSession(
  onSessionChange: (user: User | null) => void,
  onSessionExpired?: () => void
): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Validate the session
      const { valid } = await validateSession();
      if (valid) {
        onSessionChange(user);
      } else {
        onSessionChange(null);
        onSessionExpired?.();
      }
    } else {
      onSessionChange(null);
    }
  });
  
  return unsubscribe;
}

// ===========================
// PROTECTED API HELPER
// ===========================

/**
 * Helper for making authenticated API requests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

// ===========================
// SESSION TIMEOUT HANDLING
// ===========================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
let inactivityTimer: NodeJS.Timeout | null = null;

/**
 * Start inactivity timeout for session
 */
export function startInactivityTimer(onTimeout: () => void): void {
  resetInactivityTimer(onTimeout);
  
  // Reset timer on user activity
  const events = ["mousedown", "keydown", "scroll", "touchstart"];
  events.forEach((event) => {
    if (typeof window !== "undefined") {
      window.addEventListener(event, () => resetInactivityTimer(onTimeout));
    }
  });
}

/**
 * Reset the inactivity timer
 */
function resetInactivityTimer(onTimeout: () => void): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    onTimeout();
  }, SESSION_TIMEOUT_MS);
}

/**
 * Stop the inactivity timer
 */
export function stopInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}
