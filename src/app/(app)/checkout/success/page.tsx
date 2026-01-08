"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, PartyPopper, AlertCircle } from "lucide-react";
import Link from "next/link";
import { triggerFireworks } from "@/components/ui/confetti";
import { LumaSpin } from "@/components/ui/luma-spin";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    const verifyAndUpdatePlan = async () => {
      if (!sessionId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Verify the session with our API
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify payment");
        }

        if (data.planId && data.userId === user.uid) {
          // Update user's plan in Firestore
          await updateDoc(doc(db, "users", user.uid), {
            plan: data.planId,
            subscriptionId: data.subscriptionId,
            planUpdatedAt: new Date().toISOString(),
          });
          
          setPlanInfo({ name: data.planName || data.planId, id: data.planId });
          setPlanUpdated(true);
          
          // Trigger fireworks confetti animation
          triggerFireworks(5000);
        }
      } catch (err: any) {
        console.error("Plan update error:", err);
        setError(err.message);
        // Still show success UI even if plan update fails - webhook will handle it
        triggerFireworks(3000);
      } finally {
        setLoading(false);
      }
    };

    verifyAndUpdatePlan();
  }, [sessionId, user]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 max-w-lg flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LumaSpin />
          <p className="mt-4 text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 max-w-lg">
      <Card className="text-center">
        <CardHeader className="pb-4">
          {error ? (
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
          ) : (
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <PartyPopper className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
          )}
          <CardTitle className="text-2xl mt-4">
            {error ? "Payment Received!" : "Payment Successful!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <p className="text-muted-foreground">
              Your payment was processed, but we couldn&apos;t update your plan automatically. 
              It should be updated within a few minutes. If not, please contact support.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                🎉 Welcome to CareerCompass {planInfo?.name || "Premium"}! Your subscription is now active.
              </p>
              
              <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2">
                <p className="text-sm">✅ Unlimited applications</p>
                <p className="text-sm">✅ Profile boost activated</p>
                <p className="text-sm">✅ Premium features unlocked</p>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/opportunities">Browse Opportunities</Link>
            </Button>
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId.slice(0, 20)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

