"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Mail,
  MessageSquare,
  Target,
  Trophy,
  Sparkles,
  ArrowRight,
  Crown,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const AI_TOOLS = [
  {
    title: "Resume Builder",
    description: "Create an ATS-optimized, professional resume tailored to your target role",
    icon: FileText,
    href: "/ai-tools/resume-builder",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "live",
    premium: false,
  },
  {
    title: "Cover Letter Generator",
    description: "Generate personalized, compelling cover letters for any job application",
    icon: Mail,
    href: "/ai-tools/cover-letter",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    status: "live",
    premium: false,
  },
  {
    title: "Interview Prep",
    description: "Practice with AI-powered mock interviews and get instant feedback",
    icon: MessageSquare,
    href: "/ai-tools/interview-prep",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    status: "coming-soon",
    premium: true,
  },
  {
    title: "Skill Gap Analyzer",
    description: "Identify missing skills and get personalized course recommendations",
    icon: Target,
    href: "/ai-tools/skill-gap",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    status: "coming-soon",
    premium: true,
  },
  {
    title: "Salary Negotiator",
    description: "Get data-driven salary insights and negotiation scripts",
    icon: Trophy,
    href: "/ai-tools/salary",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    status: "coming-soon",
    premium: true,
  },
];

export default function AIToolsPage() {
  const { userProfile } = useAuth();
  const userPlan = userProfile?.plan || "free";
  const isPremium = ["pro", "premium"].includes(userPlan);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-3">AI Career Tools</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Supercharge your job search with our suite of AI-powered tools designed to help you stand out and land your dream job.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AI_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isLocked = tool.premium && !isPremium;
          const isComingSoon = tool.status === "coming-soon";

          return (
            <Card
              key={tool.title}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isComingSoon ? "opacity-75" : "hover:border-primary/50"
              }`}
            >
              {/* Premium Badge */}
              {tool.premium && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    Premium
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {tool.title}
                  {isComingSoon && (
                    <Badge variant="outline" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {isComingSoon ? (
                  <Button variant="outline" disabled className="w-full">
                    <Lock className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                ) : isLocked ? (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/pricing">
                      <Crown className="mr-2 h-4 w-4 text-amber-500" />
                      Upgrade to Access
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={tool.href}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA for Free Users */}
      {!isPremium && (
        <Card className="mt-12 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <Crown className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-2xl font-bold mb-2">Unlock All AI Tools</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Upgrade to Pro or Premium to access Interview Prep, Skill Gap Analyzer, 
              Salary Negotiator, and more advanced features.
            </p>
            <Button asChild size="lg">
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4" />
                View Pricing Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
