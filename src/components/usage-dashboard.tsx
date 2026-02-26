"use client";

import { useAuth } from "@/context/AuthContext";
import { AI_RATE_LIMITS, useRateLimit, formatTimeUntilReset } from "@/hooks/useRateLimit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ToolUsageProps {
  toolKey: keyof typeof AI_RATE_LIMITS;
  label: string;
}

function ToolUsageBar({ toolKey, label }: ToolUsageProps) {
  const { userProfile } = useAuth();
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit(toolKey, AI_RATE_LIMITS[toolKey], isPremium);

  const config = AI_RATE_LIMITS[toolKey];
  const max = isPremium && config.premiumMaxRequests ? config.premiumMaxRequests : config.maxRequests;
  const used = max - rateLimit.remaining;
  const pct = Math.round((used / max) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">
          {used}/{max} used
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      {!rateLimit.canProceed && (
        <p className="text-[10px] text-muted-foreground">
          Resets in {formatTimeUntilReset(rateLimit.timeUntilReset)}
        </p>
      )}
    </div>
  );
}

/**
 * Component that shows current AI tool usage against plan limits.
 * Can be embedded in profile/settings pages.
 */
export function UsageDashboard() {
  const { userProfile } = useAuth();
  const plan = userProfile?.plan || "free";

  const tools: { key: keyof typeof AI_RATE_LIMITS; label: string }[] = [
    { key: "resumeBuilder", label: "Resume Builder" },
    { key: "coverLetter", label: "Cover Letter" },
    { key: "interviewPrep", label: "Interview Prep" },
    { key: "salaryNegotiation", label: "Salary Negotiation" },
    { key: "linkedinOptimizer", label: "LinkedIn Optimizer" },
    { key: "skillGap", label: "Skill Gap Analysis" },
    { key: "emailTemplates", label: "Email Templates" },
  ];

  return (
    <Card className="rounded-3xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Tool Usage
          </CardTitle>
          <Badge variant="secondary" className="rounded-full capitalize">
            {plan} plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tools.map((tool) => (
          <ToolUsageBar key={tool.key} toolKey={tool.key} label={tool.label} />
        ))}
        {(plan === "free" || plan === "starter") && (
          <div className="pt-2 border-t border-border/50">
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="w-full rounded-full gap-2">
                <Crown className="h-3.5 w-3.5" />
                Upgrade for higher limits
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
