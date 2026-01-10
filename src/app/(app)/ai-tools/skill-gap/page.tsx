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
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Award,
  Target,
  ArrowRight,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";
import { analyzeSkillGap, type AnalyzeSkillGapOutput } from "@/ai/flows/skill-gap";
import { useRateLimit, AI_RATE_LIMITS, formatTimeUntilReset } from "@/hooks/useRateLimit";

export default function SkillGapPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Rate limiting
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit("skillGap", AI_RATE_LIMITS.skillGap, isPremium);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeSkillGapOutput | null>(null);

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState<string[]>(
    userProfile?.skills?.split(",").map((s: string) => s.trim()).filter(Boolean) || []
  );
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("");

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAnalyze = async () => {
    // Check rate limit
    if (!rateLimit.canProceed) {
      toast({
        title: "Rate Limit Reached",
        description: `You've reached your limit. Try again in ${formatTimeUntilReset(rateLimit.timeUntilReset)}.`,
        variant: "destructive",
      });
      return;
    }

    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({ title: "Please fill in job details", variant: "destructive" });
      return;
    }
    if (skills.length === 0) {
      toast({ title: "Please add your skills", variant: "destructive" });
      return;
    }

    // Increment rate limit
    rateLimit.increment();

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSkillGap({
        userSkills: skills,
        userExperience: experience || undefined,
        jobTitle,
        jobDescription,
      });
      setResult(analysis);
      toast({ title: "Analysis complete!", description: `${analysis.overallMatch}% match` });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text="Analyzing" size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">LaunchPad</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Skill Gap Analyzer</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skill Gap Analyzer</h1>
            <p className="text-muted-foreground">Compare your skills to job requirements</p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Skills */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>Add your current skills and experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skills</Label>
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
                      <button onClick={() => removeSkill(skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Experience Summary (Optional)</Label>
                <Textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Brief summary of your work experience..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Job */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Target Job</CardTitle>
              <CardDescription>Enter the job you&apos;re targeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Frontend Developer"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Description *</Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={8}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAnalyze} className="w-full rounded-full" disabled={isAnalyzing}>
                Analyze Skill Gap
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Match Score */}
          <Card className={`bg-gradient-to-r ${
            result.overallMatch >= 80 ? "from-green-500/10 to-green-500/5" :
            result.overallMatch >= 60 ? "from-yellow-500/10 to-yellow-500/5" :
            "from-red-500/10 to-red-500/5"
          }`}>
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Overall Match</h2>
                  <p className="text-muted-foreground">for {jobTitle}</p>
                </div>
                <div className="text-right">
                  <span className={`text-5xl font-bold ${
                    result.overallMatch >= 80 ? "text-green-500" :
                    result.overallMatch >= 60 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {result.overallMatch}%
                  </span>
                </div>
              </div>
              <Progress value={result.overallMatch} className="mt-4 h-3" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Matched Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.matchedSkills.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-full bg-green-500/5">
                      <span className="font-medium">{skill.skill}</span>
                      <Badge variant={
                        skill.strength === "strong" ? "default" :
                        skill.strength === "moderate" ? "secondary" : "outline"
                      }>
                        {skill.strength}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Skills */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Skills to Develop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.missingSkills.slice(0, 5).map((skill, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{skill.skill}</span>
                        <Badge variant={
                          skill.priority === "critical" ? "destructive" :
                          skill.priority === "important" ? "default" : "secondary"
                        }>
                          {skill.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        {skill.learningTime}
                      </div>
                      {skill.resources.slice(0, 2).map((resource, ri) => (
                        <div key={ri} className="flex items-center gap-2 text-sm mt-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{resource.name}</span>
                          <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge variant={
                      rec.priority === "high" ? "destructive" :
                      rec.priority === "medium" ? "default" : "secondary"
                    } className="shrink-0 mt-0.5">
                      {rec.priority}
                    </Badge>
                    <div>
                      <p className="font-medium">{rec.action}</p>
                      <p className="text-sm text-muted-foreground">{rec.timeframe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" className="rounded-full" onClick={() => setResult(null)}>
              Analyze Another Job
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/ai-tools">Back to LaunchPad</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
