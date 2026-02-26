"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PremiumGateProps {
  /** Plan required: "pro" or "premium" */
  requiredPlan?: "pro" | "premium";
  /** Name shown in the upgrade prompt */
  featureName: string;
  children: React.ReactNode;
}

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 0,
  pro: 1,
  business: 1,
  premium: 2,
};

/**
 * Wraps content that requires a paid plan.
 * If the user's plan is insufficient, shows an upgrade prompt instead.
 */
export function PremiumGate({
  requiredPlan = "pro",
  featureName,
  children,
}: PremiumGateProps) {
  const { userProfile, loading } = useAuth();

  if (loading) return null;

  const userPlan = userProfile?.plan || "free";
  const userLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 1;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="max-w-md w-full rounded-3xl border-border/50 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {featureName}
          </h2>
          <p className="text-sm text-white/70">
            This feature requires a {requiredPlan === "premium" ? "Premium" : "Pro"} plan
          </p>
        </div>

        <CardContent className="pt-6 pb-8 space-y-4">
          <div className="space-y-3">
            {[
              "Full access to all AI-powered tools",
              "Unlimited career path visualizations",
              "Priority AI processing speed",
              "Advanced analytics & insights",
            ].map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/pricing">
              <Button className="w-full rounded-full bg-violet-600 hover:bg-violet-700 gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to {requiredPlan === "premium" ? "Premium" : "Pro"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-[11px] text-center text-muted-foreground">
              Currently on <span className="font-medium capitalize">{userPlan}</span> plan
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
