"use client"

import * as React from "react"
import { BadgeCheck, Loader2 } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"

export interface PricingTier {
  id?: string
  name: string
  price: Record<string, number | string>
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  popular?: boolean
}

interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const price = tier.price[paymentFrequency]
  const isHighlighted = tier.highlighted
  const isPopular = tier.popular
  const planId = tier.id || tier.name.toLowerCase().replace(/\s+/g, "-")
  
  const isPaidPlan = typeof price === "number"
  const isContactPlan = price === "Custom"
  const isFreePlan = price === "Free"

  const handleCheckout = async () => {
    if (!isPaidPlan) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          frequency: paymentFrequency,
          userId: user?.uid,
          userEmail: user?.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    if (isPaidPlan) {
      handleCheckout()
    } else if (isContactPlan) {
      window.location.href = "mailto:contact@careercompass.com"
    }
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-6 overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:shadow-lg",
        isHighlighted
          ? "bg-foreground text-background"
          : "bg-card text-card-foreground border-border",
        isPopular && "ring-2 ring-primary"
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex items-center gap-3 text-xl font-semibold capitalize">
        {tier.name}
        {isPopular && (
          <Badge variant="secondary" className="z-10">
            🔥 Popular
          </Badge>
        )}
      </h2>

      <div className="relative h-14">
        {typeof price === "number" ? (
          <>
            <NumberFlow
              format={{
                style: "currency",
                currency: "USD",
                trailingZeroDisplay: "stripIfInteger",
              }}
              value={price}
              className="text-4xl font-bold"
            />
            <p className={cn(
              "mt-1 text-xs",
              isHighlighted ? "text-background/70" : "text-muted-foreground"
            )}>
              per month
            </p>
          </>
        ) : (
          <h1 className="text-4xl font-bold">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <h3 className={cn(
          "text-sm font-medium",
          isHighlighted ? "text-background/80" : "text-muted-foreground"
        )}>
          {tier.description}
        </h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm",
                isHighlighted ? "text-background/90" : "text-foreground"
              )}
            >
              <BadgeCheck className={cn(
                "h-4 w-4 shrink-0",
                isHighlighted ? "text-background/70" : "text-primary"
              )} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {isLoading ? (
        <div className={cn(
          "w-full h-11 flex items-center justify-center rounded-full border",
          isHighlighted ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
        )}>
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isFreePlan ? (
        <InteractiveHoverButton
          text={tier.cta}
          className={cn(
            "w-full h-11 opacity-60 cursor-not-allowed",
            isHighlighted && "bg-background text-foreground border-background"
          )}
          disabled
        />
      ) : (
        <InteractiveHoverButton
          text={tier.cta}
          className={cn(
            "w-full h-11",
            isHighlighted && "bg-background text-foreground border-background"
          )}
          onClick={handleClick}
        />
      )}
    </Card>
  )
}

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
)

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
)
