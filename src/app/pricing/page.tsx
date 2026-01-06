"use client";

import { PricingSection } from "@/components/ui/pricing-section";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FAQ } from "@/components/ui/faq-section";
import { Feature } from "@/components/ui/feature-with-advantages";

// Job Seeker Pricing Plans
const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

const JOB_SEEKER_TIERS = [
  {
    name: "Free",
    price: {
      monthly: "Free",
      yearly: "Free",
    },
    description: "Get started with job hunting",
    features: [
      "Browse all job listings",
      "5 applications per month",
      "Save up to 10 opportunities",
      "Basic profile",
      "Email notifications",
    ],
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: {
      monthly: 9.99,
      yearly: 6.99,
    },
    description: "For serious job seekers",
    features: [
      "Unlimited applications",
      "Unlimited saved jobs",
      "Profile boost & visibility",
      "Application analytics",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Premium",
    price: {
      monthly: 19.99,
      yearly: 14.99,
    },
    description: "Maximum career advantage",
    features: [
      "Everything in Pro",
      "AI resume review",
      "Skill gap analysis",
      "Salary insights",
      "1:1 career coaching",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
];

// Employer Pricing Plans
const EMPLOYER_TIERS = [
  {
    name: "Starter",
    price: {
      monthly: 49,
      yearly: 39,
    },
    description: "For small teams",
    features: [
      "Post up to 3 jobs",
      "50 applicant views/month",
      "Basic analytics",
      "Email support",
      "Standard listing",
    ],
    cta: "Get Started",
  },
  {
    name: "Business",
    price: {
      monthly: 149,
      yearly: 119,
    },
    description: "For growing companies",
    features: [
      "Post up to 10 jobs",
      "Unlimited applicant views",
      "AI candidate matching",
      "Featured listings",
      "Priority support",
    ],
    cta: "Choose Business",
    popular: true,
  },
  {
    name: "Enterprise",
    price: {
      monthly: "Custom",
      yearly: "Custom",
    },
    description: "For large organizations",
    features: [
      "Unlimited job postings",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
    ],
    cta: "Contact Sales",
    highlighted: true,
  },
];



export default function PricingPage() {
  const { role } = useAuth();
  const isEmployer = role === "employer";

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isEmployer 
              ? "Find the best talent faster with our employer plans. Post jobs, access candidates, and hire smarter."
              : "Supercharge your job search with premium features. More applications, better visibility, career coaching."}
          </p>
        </div>

        {/* Pricing Section */}
        <PricingSection
          title={isEmployer ? " " : " "}
          subtitle={isEmployer 
            ? " "
            : " "}
          frequencies={PAYMENT_FREQUENCIES}
          tiers={isEmployer ? EMPLOYER_TIERS : JOB_SEEKER_TIERS}
        />

        {/* Features Section */}
        <Feature />

        {/* FAQ Section */}
        <FAQ />
      </div>
    </div>
  );
}
