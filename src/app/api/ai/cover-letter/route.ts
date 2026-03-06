import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { isAiRateLimitError } from "@/lib/ai-rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = await request.json();
    const { generateCoverLetter } = await import("@/ai/flows/generate-cover-letter");
    const result = await generateCoverLetter(input);
    return NextResponse.json(result);
  } catch (error) {
    if (isAiRateLimitError(error)) {
      return NextResponse.json(
        { error: "Too many AI requests. Please try again later.", retryAfter: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to generate cover letter.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
