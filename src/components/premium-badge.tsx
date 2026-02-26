"use client";

import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  plan: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Shows a premium badge next to user names for paid subscribers.
 * Free/starter users get no badge.
 */
export function PremiumBadge({ plan, size = "sm", className }: PremiumBadgeProps) {
  if (!plan || plan === "free" || plan === "starter") return null;

  const isPremium = plan === "premium";
  const isPro = plan === "pro" || plan === "business";

  return (
    <Badge
      className={cn(
        "gap-0.5 rounded-full border font-medium",
        isPremium
          ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 dark:border-amber-700"
          : "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        className
      )}
    >
      <Crown className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {isPremium ? "Premium" : "Pro"}
    </Badge>
  );
}
