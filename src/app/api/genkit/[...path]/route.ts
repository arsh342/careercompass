
// Import all flows to register them with Genkit
import '@/ai/flows/generate-profile-summary';
import '@/ai/flows/analyze-opportunity-description';
import '@/ai/flows/find-matching-candidates';
import '@/ai/flows/find-and-rank-candidates';
import '@/ai/flows/send-application-status-email';
import '@/ai/flows/enhance-text';
import '@/ai/flows/parse-resume';

import { NextRequest, NextResponse } from "next/server";
import { appRoute } from "@genkit-ai/next";

// Genkit's appRoute doesn't exactly match Next.js route handler types,
// but it works correctly at runtime. Cast to satisfy the type checker.
export const POST = appRoute as unknown as (
  req: NextRequest
) => Promise<NextResponse>;
