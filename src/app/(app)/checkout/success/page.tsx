"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#8b5cf6", "#a855f7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#8b5cf6", "#a855f7"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    
    // Simulate loading
    setTimeout(() => setLoading(false), 1500);
  }, []);

  return (
    <div className="container mx-auto py-16 max-w-lg">
      <Card className="text-center">
        <CardHeader className="pb-4">
          {loading ? (
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
          ) : (
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <PartyPopper className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
          )}
          <CardTitle className="text-2xl mt-4">
            {loading ? "Processing..." : "Payment Successful!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!loading && (
            <>
              <p className="text-muted-foreground">
                🎉 Welcome to CareerCompass Premium! Your subscription is now active.
              </p>
              
              <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2">
                <p className="text-sm">✅ Unlimited applications</p>
                <p className="text-sm">✅ Profile boost activated</p>
                <p className="text-sm">✅ Premium features unlocked</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/opportunities">Browse Opportunities</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId?.slice(0, 20)}...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
