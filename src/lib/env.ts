import { z } from "zod";

// ============================================
// Environment Variable Schema
// ============================================

const envSchema = z.object({
  // Firebase Client
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "Firebase API key is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase auth domain is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase project ID is required"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase storage bucket is required"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase messaging sender ID is required"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase app ID is required"),

  // Firebase Admin (optional in dev, required in production)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Google AI
  GOOGLE_GENAI_API_KEY: z.string().min(1, "Google AI API key is required"),

  // Stripe (optional — only needed when payments are enabled)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Resend (optional — only needed for email features)
  RESEND_API_KEY: z.string().optional(),

  // Cloudinary (optional — only needed for media uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema.
 * Call this at app startup to catch missing config early.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    console.error(
      `\n❌ Invalid environment variables:\n${errorMessages}\n\nPlease check your .env file.\n`
    );

    // In production, throw to prevent startup with bad config
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }

  return (result.success ? result.data : process.env) as Env;
}

// Validate on import (runs once at startup)
export const env = validateEnv();
