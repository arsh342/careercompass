import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_DETAILS } from "@/lib/stripe";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { requireAuth, validateBody, validators, validationErrorResponse } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = withRateLimit(request, RATE_LIMITS.checkout);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication (optional for checkout - user might not be logged in yet)
    const { user } = await requireAuth(request);
    
    const body = await request.json();
    
    // Validate required fields
    const validation = validateBody(body, ["planId", "frequency"], {
      planId: validators.isNonEmptyString,
      frequency: validators.isOneOf(["monthly", "yearly"]),
    });
    
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { planId, frequency, userId, userEmail } = body;

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
