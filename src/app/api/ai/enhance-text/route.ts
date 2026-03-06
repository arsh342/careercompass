import { NextRequest, NextResponse } from "next/server";
import { enhanceText } from "@/ai/flows/enhance-text";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireAuth(req);
    if (response) return response;

    const body = await req.json();
    
    if (!body?.text || !body?.context) {
      return NextResponse.json({ error: "Text and context are required" }, { status: 400 });
    }

    const { enhancedText } = await enhanceText({
      text: body.text,
      context: body.context,
    });

    return NextResponse.json({ enhancedText });
  } catch (error: any) {
    console.error("Enhance Text error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enhance text" },
      { status: 500 }
    );
  }
}
