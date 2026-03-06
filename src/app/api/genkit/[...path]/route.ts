
// Import all flows to register them with Genkit
import '@/ai/flows/generate-profile-summary';
import '@/ai/flows/analyze-opportunity-description';
import '@/ai/flows/enhance-text';
import '@/ai/flows/parse-resume';

import { NextRequest, NextResponse } from "next/server";
import { appRoute } from "@genkit-ai/next";
import { requireAuth } from "@/lib/api-auth";
import { enforceAiRateLimit, isAiRateLimitError } from "@/lib/ai-rate-limit";

const typedAppRoute = appRoute as unknown as (
  req: NextRequest
) => Promise<NextResponse>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { response: authError, user } = await requireAuth(req);
  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await enforceAiRateLimit({
      userId: user.uid,
      tool: "genkit",
    });
    return typedAppRoute(req);
  } catch (error) {
    if (isAiRateLimitError(error)) {
      return NextResponse.json(
        {
          error: "Too many AI requests. Please try again later.",
          retryAfter: error.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        }
      );
    }

    throw error;
  }
}
