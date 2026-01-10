import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

// Stripe webhook secret - set this in your environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ===========================
// IDEMPOTENCY TRACKING
// In production, use Redis or a database
// ===========================

// In-memory store for processed event IDs (with TTL)
const processedEvents = new Map<string, number>();

// Clean up old entries every 10 minutes
const EVENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (now - timestamp > EVENT_TTL_MS) {
      processedEvents.delete(eventId);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check if event has been processed (idempotency check)
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // ===========================
    // IDEMPOTENCY CHECK
    // Prevent replay attacks and duplicate processing
    // ===========================
    
    if (isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ 
        received: true, 
        message: "Event already processed" 
      });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId && adminDb) {
          // Update user's plan in Firestore
          await adminDb.collection("users").doc(userId).update({
            plan: planId,
            subscriptionId: session.subscription,
            customerId: session.customer,
            planUpdatedAt: new Date().toISOString(),
            lastWebhookEventId: event.id, // Track for debugging
          });
          console.log(`Updated plan for user ${userId} to ${planId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId && adminDb) {
          const status = subscription.status;
          await adminDb.collection("users").doc(userId).update({
            subscriptionStatus: status,
            subscriptionUpdatedAt: new Date().toISOString(),
            lastWebhookEventId: event.id,
          });
          console.log(`Updated subscription status for user ${userId} to ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId && adminDb) {
          // Downgrade to free plan
          await adminDb.collection("users").doc(userId).update({
            plan: "free",
            subscriptionId: null,
            subscriptionStatus: "canceled",
            planUpdatedAt: new Date().toISOString(),
            lastWebhookEventId: event.id,
          });
          console.log(`Downgraded user ${userId} to free plan`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed AFTER successful handling
    markEventProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Don't expose internal error details
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};
