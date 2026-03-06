import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/api-auth";
import { enforceAiRateLimit, isAiRateLimitError } from "@/lib/ai-rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export async function POST(request: NextRequest) {
  let message = "";
  
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceAiRateLimit({
      userId: user.uid,
      tool: "emailTemplates",
    });

    const body = await request.json();
    message = body.message || "";
    const prompt = body.prompt;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      // If no API key, just return the original message
      return NextResponse.json({ improved: message });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const fullPrompt = `${prompt || "Improve this message:"} 
    
"${message}"

Respond with ONLY the improved message, no explanations or quotation marks.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const improved = response.text().trim();

    return NextResponse.json({ improved });
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

    console.error("AI message improvement error:", error);
    // Return original message on error (graceful degradation)
    return NextResponse.json({ improved: message || "Error processing message" });
  }
}
