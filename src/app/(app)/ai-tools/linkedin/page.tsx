"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Linkedin,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Lightbulb,
  Hash,
  Target,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";
import { optimizeLinkedIn, type OptimizeLinkedInOutput } from "@/ai/flows/linkedin-optimizer";
import { useRateLimit, AI_RATE_LIMITS, formatTimeUntilReset } from "@/hooks/useRateLimit";

export default function LinkedInOptimizerPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Rate limiting
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit("linkedinOptimizer", AI_RATE_LIMITS.linkedinOptimizer, isPremium);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeLinkedInOutput | null>(null);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [copiedAbout, setCopiedAbout] = useState(false);

  // Form state
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [currentAbout, setCurrentAbout] = useState("");
  const [skills, setSkills] = useState<string[]>(
    userProfile?.skills?.split(",").map((s: string) => s.trim()).filter(Boolean) || []
  );
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
    setSkillInput("");
  };

  const handleOptimize = async () => {
    // Check rate limit
    if (!rateLimit.canProceed) {
      toast({
        title: "Rate Limit Reached",
        description: `You've reached your limit. Try again in ${formatTimeUntilReset(rateLimit.timeUntilReset)}.`,
        variant: "destructive",
      });
      return;
    }

    if (!role.trim() || !industry.trim()) {
      toast({ title: "Please fill in role and industry", variant: "destructive" });
      return;
    }
    if (skills.length === 0) {
      toast({ title: "Please add your skills", variant: "destructive" });
      return;
    }

    // Increment rate limit
    rateLimit.increment();

    setIsOptimizing(true);
    try {
      const optimization = await optimizeLinkedIn({
        role,
        industry,
        skills,
        currentHeadline: currentHeadline || undefined,
        currentAbout: currentAbout || undefined,
      });
      setResult(optimization);
      toast({ title: "Profile optimized!", description: `${optimization.completenessScore}% completeness` });
    } catch (error: any) {
      toast({
        title: "Optimization failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyHeadline = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.headline.recommended);
    setCopiedHeadline(true);
    setTimeout(() => setCopiedHeadline(false), 2000);
    toast({ title: "Headline copied!" });
  };

  const copyAbout = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.about.content);
    setCopiedAbout(true);
    setTimeout(() => setCopiedAbout(false), 2000);
    toast({ title: "About section copied!" });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl relative">
      {isOptimizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text="Optimizing" size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">LaunchPad</Link>
          <ChevronRight className="h-4 w-4" />
          <span>LinkedIn Optimizer</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0077B5]/10 rounded-lg">
            <Linkedin className="h-6 w-6 text-[#0077B5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LinkedIn Optimizer</h1>
            <p className="text-muted-foreground">Get noticed by recruiters with an optimized profile</p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Your Target</CardTitle>
              <CardDescription>What role are you targeting?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Role *</Label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Senior Product Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Technology"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    placeholder="Add a skill..."
                  />
                  <Button variant="outline" size="icon" onClick={() => addSkill(skillInput)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button onClick={() => setSkills(skills.filter((s: string) => s !== skill))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Current Profile (Optional)</CardTitle>
              <CardDescription>Share your current content for better suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Headline</Label>
                <Input
                  value={currentHeadline}
                  onChange={(e) => setCurrentHeadline(e.target.value)}
                  placeholder="Your current LinkedIn headline..."
                />
              </div>
              <div className="space-y-2">
                <Label>Current About Section</Label>
                <Textarea
                  value={currentAbout}
                  onChange={(e) => setCurrentAbout(e.target.value)}
                  placeholder="Your current about section..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleOptimize} className="w-full rounded-full" disabled={isOptimizing}>
                Optimize
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Completeness Score */}
          <Card className="bg-gradient-to-r from-[#0077B5]/10 to-[#0077B5]/5 rounded-3xl">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Profile Completeness</h3>
                  <p className="text-sm text-muted-foreground">Based on LinkedIn best practices</p>
                </div>
                <span className="text-3xl font-bold text-[#0077B5]">{result.completenessScore}%</span>
              </div>
              <Progress value={result.completenessScore} className="h-2" />
            </CardContent>
          </Card>

          {/* Optimized Headline */}
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Optimized Headline
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyHeadline}>
                  {copiedHeadline ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedHeadline ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <p className="font-medium">{result.headline.recommended}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Alternatives</h4>
                <div className="space-y-2">
                  {result.headline.alternatives.map((alt, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                      {alt}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Keywords to Include</h4>
                <div className="flex flex-wrap gap-2">
                  {result.headline.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary">
                      <Hash className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimized About */}
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Optimized About Section</CardTitle>
                <Button variant="outline" size="sm" onClick={copyAbout}>
                  {copiedAbout ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedAbout ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {result.about.content}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Structure</h4>
                <div className="flex flex-wrap gap-2">
                  {result.about.structure.map((section, i) => (
                    <Badge key={i} variant="outline">{section}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-500/10 rounded-lg">
                <h4 className="text-sm font-medium text-green-600 mb-1">Call to Action</h4>
                <p className="text-sm">{result.about.callToAction}</p>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Keywords */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Keywords
              </CardTitle>
              <CardDescription>Include these throughout your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.keywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        kw.importance === "critical" ? "destructive" :
                        kw.importance === "important" ? "default" : "secondary"
                      }>
                        {kw.importance}
                      </Badge>
                      <span className="font-medium">{kw.keyword}</span>
                    </div>
                    <div className="flex gap-1">
                      {kw.placement.map((place, pi) => (
                        <Badge key={pi} variant="outline" className="text-xs">{place}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Tips */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Section-by-Section Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.profileTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge variant={
                      tip.priority === "high" ? "destructive" :
                      tip.priority === "medium" ? "default" : "secondary"
                    } className="shrink-0 mt-0.5">
                      {tip.section}
                    </Badge>
                    <p className="text-sm">{tip.tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Quick Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              Optimize Again
            </Button>
            <Button asChild>
              <Link href="/ai-tools">Back to LaunchPad</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
