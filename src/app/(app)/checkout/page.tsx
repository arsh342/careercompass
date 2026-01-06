"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Sparkles, Crown, Zap, Loader2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// Plan details
const PLANS: Record<string, {
  name: string;
  price: { monthly: number | string; yearly: number | string };
  description: string;
  features: string[];
  icon: typeof Sparkles;
}> = {
  pro: {
    name: "Pro",
    price: { monthly: 9.99, yearly: 6.99 },
    description: "For serious job seekers",
    features: [
      "Unlimited applications",
      "Unlimited saved jobs",
      "Profile boost & visibility",
      "Application analytics",
      "Priority email support",
    ],
    icon: Zap,
  },
  premium: {
    name: "Premium",
    price: { monthly: 19.99, yearly: 14.99 },
    description: "Maximum career advantage",
    features: [
      "Everything in Pro",
      "AI resume review",
      "Skill gap analysis",
      "Salary insights",
      "1:1 career coaching",
    ],
    icon: Crown,
  },
  starter: {
    name: "Starter",
    price: { monthly: 49, yearly: 39 },
    description: "For small teams",
    features: [
      "Post up to 3 jobs",
      "50 applicant views/month",
      "Basic analytics",
      "Email support",
      "Standard listing",
    ],
    icon: Zap,
  },
  business: {
    name: "Business",
    price: { monthly: 149, yearly: 119 },
    description: "For growing companies",
    features: [
      "Post up to 10 jobs",
      "Unlimited applicant views",
      "AI candidate matching",
      "Featured listings",
      "Priority support",
    ],
    icon: Sparkles,
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const planId = searchParams.get("plan") || "pro";
  const frequency = searchParams.get("frequency") || "monthly";
  const plan = PLANS[planId] || PLANS.pro;
  
  const [isLoading, setIsLoading] = useState(false);

  const price = plan.price[frequency as keyof typeof plan.price];
  const PlanIcon = plan.icon;

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          frequency,
          userId: user?.uid,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Back Button */}
      <Link 
        href="/pricing" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pricing
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">
          <CreditCard className="h-3 w-3 mr-1" />
          Secure Checkout
        </Badge>
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">
          You're subscribing to the {plan.name} plan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <PlanIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{plan.name} Plan</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {typeof price === "number" ? `$${price}` : price}
              </span>
              <span className="text-muted-foreground">/{frequency}</span>
              {frequency === "yearly" && (
                <Badge variant="secondary" className="ml-2">Save 35%</Badge>
              )}
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{plan.name} Plan ({frequency})</span>
              <span>{typeof price === "number" ? `$${price}` : price}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Tax</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between py-2 font-semibold text-lg">
              <span>Total</span>
              <span>{typeof price === "number" ? `$${price}` : price}/{frequency}</span>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
              <p>✓ Cancel anytime</p>
              <p>✓ 7-day money-back guarantee</p>
              <p>✓ Instant access to all features</p>
              <p>✓ Secure payment via Stripe</p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              🔒 Payments are processed securely by Stripe
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
