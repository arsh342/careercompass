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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Lightbulb,
  Clock,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Handshake,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";
import { generateEmail, type GenerateEmailOutput, type GenerateEmailInput } from "@/ai/flows/email-templates";
import { useRateLimit, AI_RATE_LIMITS, formatTimeUntilReset } from "@/hooks/useRateLimit";

type TemplateType = GenerateEmailInput['templateType'];

const TEMPLATE_TYPES: { value: TemplateType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'follow-up', label: 'Follow-up', icon: Send, description: 'After application or interview' },
  { value: 'thank-you', label: 'Thank You', icon: ThumbsUp, description: 'Post-interview gratitude' },
  { value: 'networking', label: 'Networking', icon: Handshake, description: 'Reaching out to connections' },
  { value: 'referral-request', label: 'Referral Request', icon: UserPlus, description: 'Asking for internal referral' },
  { value: 'negotiate-salary', label: 'Salary Negotiation', icon: MessageSquare, description: 'Counter-offer response' },
  { value: 'accept-offer', label: 'Accept Offer', icon: ThumbsUp, description: 'Accepting a job offer' },
  { value: 'decline-offer', label: 'Decline Offer', icon: ThumbsDown, description: 'Politely declining' },
  { value: 'withdraw', label: 'Withdraw', icon: XCircle, description: 'Withdrawing application' },
];

export default function EmailTemplatesPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Rate limiting
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit("emailTemplates", AI_RATE_LIMITS.emailTemplates, isPremium);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateEmailOutput | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Form state
  const [templateType, setTemplateType] = useState<TemplateType>('follow-up');
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<'formal' | 'professional' | 'friendly'>('professional');

  const handleGenerate = async () => {
    // Check rate limit
    if (!rateLimit.canProceed) {
      toast({
        title: "Rate Limit Reached",
        description: `You've reached your limit. Try again in ${formatTimeUntilReset(rateLimit.timeUntilReset)}.`,
        variant: "destructive",
      });
      return;
    }

    if (!companyName.trim()) {
      toast({ title: "Please enter company name", variant: "destructive" });
      return;
    }

    // Increment rate limit
    rateLimit.increment();

    setIsGenerating(true);
    try {
      const email = await generateEmail({
        templateType,
        companyName,
        jobTitle: jobTitle || undefined,
        recipientName: recipientName || undefined,
        recipientTitle: recipientTitle || undefined,
        context: context || undefined,
        userName: user?.displayName || "Candidate",
        tone,
      });
      setResult(email);
      toast({ title: "Email generated!" });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copySubject = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
    toast({ title: "Subject copied!" });
  };

  const copyBody = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
    toast({ title: "Email body copied!" });
  };

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    toast({ title: "Full email copied!" });
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
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text="Writing" size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">LaunchPad</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Email Templates</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">Generate professional emails for any situation</p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Template Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Email Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TEMPLATE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setTemplateType(type.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        templateType === type.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 ${
                        templateType === type.value ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Google"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Sarah Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Title</Label>
                  <Input
                    value={recipientTitle}
                    onChange={(e) => setRecipientTitle(e.target.value)}
                    placeholder="Hiring Manager"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Context / Additional Details</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any specific details like interview date, discussion points, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger className="w-48 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} className="w-full rounded-full" disabled={isGenerating}>
                Generate
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Subject Line */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subject Line</CardTitle>
                <Button className="rounded-full" variant="outline" size="sm" onClick={copySubject}>
                  {copiedSubject ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSubject ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg font-medium">
                {result.subject}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Alternatives</h4>
                <div className="space-y-2">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{alt.subject}</p>
                      <p className="text-xs text-muted-foreground">{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Body */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Body</CardTitle>
                <div className="flex gap-2">
                  <Button className="rounded-full" variant="outline" size="sm" onClick={copyBody}>
                    {copiedBody ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copiedBody ? "Copied!" : "Copy Body"}
                  </Button>
                  <Button className="rounded-full" size="sm" onClick={copyAll}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {result.body}
              </div>
            </CardContent>
          </Card>

          {/* Tips & Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Best Time to Send
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.timing}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button className="rounded-full" variant="outline" onClick={() => setResult(null)}>
              Generate Another
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
