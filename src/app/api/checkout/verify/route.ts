import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_DETAILS } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get plan info from metadata
    const planId = session.metadata?.planId;
    const userId = session.metadata?.userId;
    const frequency = session.metadata?.frequency;

    // Get plan name from our config
    const planName = planId ? PLAN_DETAILS[planId]?.name : null;

    return NextResponse.json({
      success: true,
      planId,
      planName,
      userId,
      frequency,
      subscriptionId: session.subscription,
      customerId: session.customer,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error: any) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
