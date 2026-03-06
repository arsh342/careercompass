import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export type AiRateLimitKey =
  | "coverLetter"
  | "resumeBuilder"
  | "interviewPrep"
  | "linkedinOptimizer"
  | "salaryNegotiation"
  | "skillGap"
  | "emailTemplates"
  | "profileSummary"
  | "textEnhancement"
  | "resumeParser"
  | "opportunityAnalysis"
  | "careerPath"
  | "jobMatch"
  | "genkit";

interface AiRateLimitConfig {
  maxRequests: number;
  windowMs: number;
  premiumMaxRequests?: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

const AI_SERVER_RATE_LIMITS: Record<AiRateLimitKey, AiRateLimitConfig> = {
  coverLetter: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  resumeBuilder: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  interviewPrep: { maxRequests: 10, windowMs: ONE_HOUR_MS, premiumMaxRequests: 50 },
  linkedinOptimizer: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  salaryNegotiation: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  skillGap: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  emailTemplates: { maxRequests: 10, windowMs: ONE_HOUR_MS, premiumMaxRequests: 50 },
  profileSummary: { maxRequests: 10, windowMs: ONE_HOUR_MS, premiumMaxRequests: 40 },
  textEnhancement: { maxRequests: 20, windowMs: ONE_HOUR_MS, premiumMaxRequests: 80 },
  resumeParser: { maxRequests: 8, windowMs: ONE_HOUR_MS, premiumMaxRequests: 30 },
  opportunityAnalysis: { maxRequests: 10, windowMs: ONE_HOUR_MS, premiumMaxRequests: 40 },
  careerPath: { maxRequests: 5, windowMs: ONE_HOUR_MS, premiumMaxRequests: 20 },
  jobMatch: { maxRequests: 10, windowMs: ONE_HOUR_MS, premiumMaxRequests: 40 },
  genkit: { maxRequests: 20, windowMs: ONE_HOUR_MS, premiumMaxRequests: 80 },
};

export class AiRateLimitError extends Error {
  readonly resetTime: number;
  readonly retryAfterSeconds: number;

  constructor(resetTime: number) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    super(`Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`);
    this.name = "AiRateLimitError";
    this.resetTime = resetTime;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

function isPaidPlan(plan?: string | null): boolean {
  return plan === "premium" || plan === "pro";
}

async function getUserPlan(userId: string): Promise<string | null> {
  if (!adminDb) {
    throw new Error("Authentication service unavailable");
  }

  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }

  const userData = userDoc.data() as Record<string, unknown>;
  return typeof userData.plan === "string" ? userData.plan : null;
}

export async function enforceAiRateLimit(options: {
  userId: string;
  tool: AiRateLimitKey;
  plan?: string | null;
}): Promise<{ remaining: number; resetTime: number }> {
  const { userId, tool } = options;
  const config = AI_SERVER_RATE_LIMITS[tool];

  if (!adminDb) {
    throw new Error("Authentication service unavailable");
  }

  const plan = options.plan ?? (await getUserPlan(userId));
  const maxRequests =
    isPaidPlan(plan) && config.premiumMaxRequests
      ? config.premiumMaxRequests
      : config.maxRequests;

  const now = Date.now();
  const windowStart = getWindowStart(now, config.windowMs);
  const resetTime = windowStart + config.windowMs;
  const docId = `${tool}_${userId}_${windowStart}`;
  const docRef = adminDb.collection("_internalRateLimits").doc(docId);

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    const currentCount = snapshot.exists ? Number(snapshot.get("count") || 0) : 0;

    if (currentCount >= maxRequests) {
      throw new AiRateLimitError(resetTime);
    }

    const timestampNow = Timestamp.fromMillis(now);
    const createdAt =
      snapshot.exists && snapshot.get("createdAt") instanceof Timestamp
        ? (snapshot.get("createdAt") as Timestamp)
        : timestampNow;

    transaction.set(
      docRef,
      {
        userId,
        tool,
        count: currentCount + 1,
        maxRequests,
        planTier: isPaidPlan(plan) ? "paid" : "free",
        windowStart: Timestamp.fromMillis(windowStart),
        resetTime: Timestamp.fromMillis(resetTime),
        expiresAt: Timestamp.fromMillis(resetTime + 7 * 24 * 60 * 60 * 1000),
        createdAt,
        updatedAt: timestampNow,
      },
      { merge: true }
    );

    return {
      remaining: Math.max(0, maxRequests - (currentCount + 1)),
      resetTime,
    };
  });
}

export function isAiRateLimitError(error: unknown): error is AiRateLimitError {
  return error instanceof AiRateLimitError;
}
