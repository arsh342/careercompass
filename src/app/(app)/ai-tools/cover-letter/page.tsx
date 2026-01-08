"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Wand2,
  ArrowLeft,
  Building2,
  User,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCoverLetter } from "@/ai/flows/generate-cover-letter";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoaderInline } from "@/components/ui/ai-loader";
import Link from "next/link";

type Tone = "professional" | "enthusiastic" | "confident" | "conversational";
type Length = "short" | "medium" | "long";

interface CoverLetterData {
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  experience: string;
  skills: string;
  achievements: string;
  jobTitle: string;
  company: string;
  hiringManager: string;
  jobDescription: string;
  tone: Tone;
  length: Length;
}

interface GeneratedCoverLetter {
  coverLetter: string;
  keyPoints: string[];
  matchedSkills: string[];
  suggestions: string[];
}

export default function CoverLetterGeneratorPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<CoverLetterData>({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    currentTitle: "",
    experience: userProfile?.employmentHistory || "",
    skills: userProfile?.skills || "",
    achievements: "",
    jobTitle: "",
    company: "",
    hiringManager: "",
    jobDescription: "",
    tone: "professional",
    length: "medium",
  });

  const updateField = (field: keyof CoverLetterData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.jobTitle || !formData.company || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in the job title, company, and job description.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCoverLetter({
        userInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          currentTitle: formData.currentTitle,
          experience: formData.experience,
          skills: formData.skills,
          achievements: formData.achievements,
        },
        jobInfo: {
          title: formData.jobTitle,
          company: formData.company,
          description: formData.jobDescription,
          hiringManager: formData.hiringManager,
        },
        tone: formData.tone,
        length: formData.length,
      });

      setGeneratedLetter(result);
      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter is ready.",
      });
    } catch (error: any) {
      console.error("Cover letter generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
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
        <p className="text-muted-foreground mb-6">Please log in to access the Cover Letter Generator.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/ai-tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Tools
          </Link>
        </Button>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Cover Letter Generator</h1>
          <p className="text-muted-foreground">
            Create personalized, compelling cover letters in seconds
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Your Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTitle">Current Title</Label>
                  <Input
                    id="currentTitle"
                    value={formData.currentTitle}
                    onChange={(e) => updateField("currentTitle", e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Relevant Experience</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  placeholder="Brief summary of your relevant experience..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Key Skills</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  placeholder="React, TypeScript, Node.js, AWS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievements">Key Achievements (Optional)</Label>
                <Textarea
                  id="achievements"
                  value={formData.achievements}
                  onChange={(e) => updateField("achievements", e.target.value)}
                  placeholder="Notable achievements to highlight..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="Senior Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hiringManager">Hiring Manager (Optional)</Label>
                <Input
                  id="hiringManager"
                  value={formData.hiringManager}
                  onChange={(e) => updateField("hiringManager", e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => updateField("jobDescription", e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value: Tone) => updateField("tone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="confident">Confident</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select
                    value={formData.length}
                    onValueChange={(value: Length) => updateField("length", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (150-200 words)</SelectItem>
                      <SelectItem value="medium">Medium (250-350 words)</SelectItem>
                      <SelectItem value="long">Long (400+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Output Panel */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Generated Cover Letter
                </CardTitle>
                {generatedLetter && (
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <AILoaderInline text="Writing" size={140} />
              ) : generatedLetter ? (
                <div className="space-y-6">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-muted-foreground">
                    {generatedLetter.coverLetter}
                  </div>

                  {/* Matched Skills */}
                  {generatedLetter.matchedSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Skills Addressed
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedLetter.matchedSkills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {generatedLetter.suggestions.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Personalization Tips
                      </h4>
                      <ul className="space-y-1">
                        {generatedLetter.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Fill in the form and click Generate</p>
                  <p className="text-sm">Your cover letter will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
