"use client";

import { useState } from "react";
import { generateCareerPath, type CareerPathOutput } from "@/ai/flows/career-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Target,
  Zap,
  Clock,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Route,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumGate } from "@/components/premium-gate";

export default function CareerPathPage() {
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("0");
  const [industry, setIndustry] = useState("");
  const [result, setResult] = useState<CareerPathOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!currentRole.trim() || !targetRole.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const output = await generateCareerPath({
        currentRole: currentRole.trim(),
        targetRole: targetRole.trim(),
        currentSkills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        yearsOfExperience: parseInt(experience) || 0,
        industry: industry.trim() || undefined,
      });
      setResult(output);
    } catch (err: any) {
      setError(err.message || "Failed to generate career path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate featureName="Career Path Visualizer" requiredPlan="pro">
    <div className="min-h-screen -m-4 md:-m-6 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/ai-tools">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Route className="h-7 w-7 text-indigo-500" />
              Career Path Visualizer
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered career progression roadmap with skill milestones
            </p>
          </div>
        </div>

        {/* Input Form */}
        <Card className="mb-8 rounded-3xl border-border/50">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Role *</label>
                <Input
                  placeholder="e.g. Junior Software Developer"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Role *</label>
                <Input
                  placeholder="e.g. VP of Engineering"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="rounded-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skills (comma-separated)</label>
                <Input
                  placeholder="React, Python, AWS..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Experience</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl">
                    {[0, 1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                      <SelectItem className="rounded-full" key={y} value={y.toString()}>
                        {y === 0 ? "No experience" : `${y}+ years`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry (optional)</label>
                <Input
                  placeholder="e.g. FinTech, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="rounded-full"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleGenerate}
                disabled={loading || !currentRole.trim() || !targetRole.trim()}
                className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Career Path
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5 rounded-3xl">
            <CardContent className="pt-6">
              <p className="text-red-500 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="rounded-3xl bg-indigo-500/10 border-indigo-500/20">
                  <CardContent className="pt-6 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
                    <p className="text-2xl font-bold">{result.estimatedTimeYears} years</p>
                    <p className="text-sm text-muted-foreground">Estimated Timeline</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl bg-emerald-500/10 border-emerald-500/20">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold">{result.steps.length} stages</p>
                    <p className="text-sm text-muted-foreground">Career Progression</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-6 text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{result.quickWins.length}</p>
                    <p className="text-sm text-muted-foreground">Quick Wins</p>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card className="rounded-3xl mb-8 border-border/50">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Timeline */}
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Route className="h-5 w-5 text-indigo-500" />
                Your Career Roadmap
              </h2>
              <div className="relative mb-10">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-emerald-500 hidden md:block" />

                <div className="space-y-4">
                  {result.steps.map((step, i) => {
                    const isExpanded = expandedStep === i;
                    const isFirst = i === 0;
                    const isLast = i === result.steps.length - 1;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-indigo-500 bg-background z-10 hidden md:block" />

                        {/* Card */}
                        <div className="md:ml-16">
                          <Card
                            className={`rounded-3xl cursor-pointer transition-all hover:border-indigo-500/30 ${
                              isFirst
                                ? "border-indigo-500/50 bg-indigo-500/5"
                                : isLast
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : "border-border/50"
                            }`}
                            onClick={() => setExpandedStep(isExpanded ? null : i)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant="outline"
                                    className={`rounded-full text-xs ${
                                      isFirst
                                        ? "border-indigo-500 text-indigo-500"
                                        : isLast
                                        ? "border-emerald-500 text-emerald-500"
                                        : ""
                                    }`}
                                  >
                                    {isFirst ? "Current" : isLast ? "Target" : `Stage ${i + 1}`}
                                  </Badge>
                                  <CardTitle className="text-lg">{step.title}</CardTitle>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-muted-foreground">
                                    ~{step.durationMonths} months
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            </CardHeader>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <CardContent className="pt-2 space-y-4">
                                    {/* Skills */}
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5" /> Skills to Develop
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {step.skills.map((skill, j) => (
                                          <Badge
                                            key={j}
                                            variant={
                                              skill.level === "master"
                                                ? "default"
                                                : skill.level === "strengthen"
                                                ? "secondary"
                                                : "outline"
                                            }
                                            className="rounded-full"
                                          >
                                            {skill.name}
                                            <span className="ml-1 opacity-60 text-[10px] uppercase">
                                              {skill.level}
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Milestones */}
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <Award className="h-3.5 w-3.5" /> Key Milestones
                                      </p>
                                      <ul className="space-y-1.5">
                                        {step.milestones.map((m, j) => (
                                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <Target className="h-3.5 w-3.5 mt-0.5 text-indigo-500 shrink-0" />
                                            {m}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Salary */}
                                    {step.salaryRange && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-muted-foreground">
                                          Typical salary: <strong>{step.salaryRange}</strong>
                                        </span>
                                      </div>
                                    )}
                                  </CardContent>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Wins */}
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Wins — Start Today
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {result.quickWins.map((win, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <Card className="rounded-3xl border-border/50 h-full">
                      <CardContent className="pt-6">
                        <p className="font-medium text-sm mb-2">{win.action}</p>
                        <p className="text-xs text-muted-foreground mb-3">{win.impact}</p>
                        <Badge variant="outline" className="rounded-full text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {win.timeframe}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Alternative Paths */}
              {result.alternativePaths && result.alternativePaths.length > 0 && (
                <>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-purple-500" />
                    Alternative Paths
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {result.alternativePaths.map((alt, i) => (
                      <Card key={i} className="rounded-3xl border-border/50">
                        <CardContent className="pt-6">
                          <p className="font-medium mb-1">{alt.path}</p>
                          <p className="text-sm text-muted-foreground">{alt.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </PremiumGate>
  );
}
