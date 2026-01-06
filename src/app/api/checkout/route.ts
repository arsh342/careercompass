import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_DETAILS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { planId, frequency, userId, userEmail } = await request.json();

    if (!planId || !frequency) {
      return NextResponse.json(
        { error: "Missing planId or frequency" },
        { status: 400 }
      );
    }

    const plan = PLAN_DETAILS[planId];
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const price = plan.prices[frequency as keyof typeof plan.prices];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: price,
            recurring: {
              interval: frequency === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: userEmail,
      metadata: {
        userId: userId || "",
        planId,
        frequency,
      },
      subscription_data: {
        metadata: {
          userId: userId || "",
          planId,
          frequency,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
