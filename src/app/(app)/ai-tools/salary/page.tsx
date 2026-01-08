"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Copy,
  Check,
  Lightbulb,
  Target,
  Gift,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";
import { getSalaryNegotiationAdvice, type SalaryNegotiationOutput } from "@/ai/flows/salary-negotiation";

type NegotiationType = "new-offer" | "raise" | "counter-offer" | "research";

export default function SalaryNegotiatorPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SalaryNegotiationOutput | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Form state
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState(3);
  const [currentSalary, setCurrentSalary] = useState<number | undefined>();
  const [offeredSalary, setOfferedSalary] = useState<number | undefined>();
  const [negotiationType, setNegotiationType] = useState<NegotiationType>("research");

  const handleAnalyze = async () => {
    if (!role.trim() || !location.trim()) {
      toast({ title: "Please fill in role and location", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const advice = await getSalaryNegotiationAdvice({
        role,
        company: company || undefined,
        location,
        experienceYears,
        currentSalary,
        offeredSalary,
        negotiationType,
      });
      setResult(advice);
      toast({ title: "Analysis complete!" });
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

  const copyScript = () => {
    if (!result) return;
    const script = `${result.negotiationScript.opening}\n\nKey Points:\n${result.negotiationScript.keyPoints.map(p => `- ${p}`).join("\n")}\n\n${result.negotiationScript.closing}`;
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    toast({ title: "Script copied!" });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
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
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text="Researching" size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">LaunchPad</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Salary Negotiator</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Salary Negotiator</h1>
            <p className="text-muted-foreground">Get market data and negotiation scripts</p>
          </div>
        </div>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Salary Research</CardTitle>
            <CardDescription>Enter your details for personalized advice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Role *</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Company (Optional)</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Google"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Select value={experienceYears.toString()} onValueChange={(v) => setExperienceYears(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y === 0 ? "Entry Level" : `${y}+ years`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Salary (Optional)</Label>
                <Input
                  type="number"
                  value={currentSalary || ""}
                  onChange={(e) => setCurrentSalary(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-2">
                <Label>Offered Salary (Optional)</Label>
                <Input
                  type="number"
                  value={offeredSalary || ""}
                  onChange={(e) => setOfferedSalary(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>What do you need?</Label>
              <Select value={negotiationType} onValueChange={(v) => setNegotiationType(v as NegotiationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Market Research</SelectItem>
                  <SelectItem value="new-offer">Negotiate New Offer</SelectItem>
                  <SelectItem value="counter-offer">Counter Offer</SelectItem>
                  <SelectItem value="raise">Ask for a Raise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} className="w-full" disabled={isAnalyzing}>
              <Sparkles className="h-4 w-4 mr-2" />
              Get Salary Insights
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Market Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Market Salary Range
              </CardTitle>
              <CardDescription>
                Based on {role} in {location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Low</p>
                  <p className="text-xl font-bold">{formatCurrency(result.marketData.lowRange, result.marketData.currency)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Mid</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(result.marketData.midRange, result.marketData.currency)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">High</p>
                  <p className="text-xl font-bold">{formatCurrency(result.marketData.highRange, result.marketData.currency)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.marketData.factors.map((factor, i) => (
                  <Badge key={i} variant="outline">{factor}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target */}
          <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recommended Target</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(result.analysis.targetSalary, result.marketData.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Minimum Acceptable</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(result.analysis.minimumAcceptable, result.marketData.currency)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm">{result.analysis.recommendation}</p>
            </CardContent>
          </Card>

          {/* Negotiation Script */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Negotiation Script
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyScript}>
                  {copiedScript ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedScript ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Opening</h4>
                <p className="text-sm bg-muted p-3 rounded-lg">{result.negotiationScript.opening}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Key Points to Emphasize</h4>
                <ul className="space-y-2">
                  {result.negotiationScript.keyPoints.map((point, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Common Objections & Responses</h4>
                <div className="space-y-3">
                  {result.negotiationScript.responses.slice(0, 3).map((r, i) => (
                    <div key={i} className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-orange-600">"{r.objection}"</p>
                      <p className="text-sm mt-1">{r.response}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Closing</h4>
                <p className="text-sm bg-muted p-3 rounded-lg">{result.negotiationScript.closing}</p>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Other Things to Negotiate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.alternativeCompensation.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">{item.typicalValue}</p>
                    </div>
                    <Badge variant={
                      item.negotiability === "high" ? "default" :
                      item.negotiability === "medium" ? "secondary" : "outline"
                    }>
                      {item.negotiability}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setResult(null)}>
              New Research
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
