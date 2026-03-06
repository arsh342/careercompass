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

    const { action, payload } = await request.json();
    const interviewPrep = await import("@/ai/flows/interview-prep");

    if (action === "generateQuestions") {
      const result = await interviewPrep.generateInterviewQuestions(payload);
      return NextResponse.json(result);
    }

    if (action === "evaluateAnswer") {
      const result = await interviewPrep.evaluateInterviewAnswer(payload);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (isAiRateLimitError(error)) {
      return NextResponse.json(
        { error: "Too many AI requests. Please try again later.", retryAfter: error.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
    const message = error instanceof Error ? error.message : "Interview prep request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
