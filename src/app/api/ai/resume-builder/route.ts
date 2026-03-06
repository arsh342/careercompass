import { NextRequest, NextResponse } from "next/server";
import { isAiRateLimitError } from "@/lib/ai-rate-limit";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = await request.json();
    const { generateFullResume } = await import("@/ai/flows/generate-resume");
    const result = await generateFullResume(input);

    return NextResponse.json(result);
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

    const message =
      error instanceof Error ? error.message : "Failed to enhance resume. Please try again.";

    console.error("Resume builder API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
