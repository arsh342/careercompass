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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  Clock,
  Target,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  type GenerateQuestionsOutput,
  type EvaluateAnswerOutput,
} from "@/ai/flows/interview-prep";
import { useRateLimit, AI_RATE_LIMITS, formatTimeUntilReset } from "@/hooks/useRateLimit";

type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
type QuestionType = "behavioral" | "technical" | "situational" | "all";

interface Question {
  id: string;
  question: string;
  type: "behavioral" | "technical" | "situational";
  difficulty: "easy" | "medium" | "hard";
  tips: string;
  sampleAnswer: string;
  followUps: string[];
  userAnswer?: string;
  evaluation?: EvaluateAnswerOutput;
}

export default function InterviewPrepPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Rate limiting
  const isPremium = userProfile?.plan === "premium" || userProfile?.plan === "pro";
  const rateLimit = useRateLimit("interviewPrep", AI_RATE_LIMITS.interviewPrep, isPremium);

  const [step, setStep] = useState<"setup" | "practice" | "review">("setup");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Setup state
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [questionType, setQuestionType] = useState<QuestionType>("all");
  const [questionCount, setQuestionCount] = useState(5);

  // Practice state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generalTips, setGeneralTips] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showTips, setShowTips] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  const handleGenerateQuestions = async () => {
    // Check rate limit
    if (!rateLimit.canProceed) {
      toast({
        title: "Rate Limit Reached",
        description: `You've reached your limit. Try again in ${formatTimeUntilReset(rateLimit.timeUntilReset)}.`,
        variant: "destructive",
      });
      return;
    }

    if (!role.trim()) {
      toast({ title: "Please enter a role", variant: "destructive" });
      return;
    }

    // Increment rate limit
    rateLimit.increment();

    setIsGenerating(true);
    try {
      const result = await generateInterviewQuestions({
        role,
        company: company || undefined,
        experienceLevel,
        questionType,
        count: questionCount,
      });

      setQuestions(result.questions.map(q => ({ ...q })));
      setGeneralTips(result.generalTips);
      setStep("practice");
      toast({ title: "Questions generated!", description: `${result.questions.length} questions ready` });
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

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({ title: "Please enter your answer", variant: "destructive" });
      return;
    }

    setIsEvaluating(true);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const evaluation = await evaluateInterviewAnswer({
        question: currentQuestion.question,
        questionType: currentQuestion.type,
        userAnswer: currentAnswer,
        role,
        experienceLevel,
      });

      // Update question with answer and evaluation
      const updated = [...questions];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        userAnswer: currentAnswer,
        evaluation,
      };
      setQuestions(updated);
      setShowTips(false);
      setShowSampleAnswer(false);

      toast({
        title: `Score: ${evaluation.score}/100`,
        description: evaluation.score >= 70 ? "Great answer!" : "Room for improvement",
      });
    } catch (error: any) {
      toast({
        title: "Evaluation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer("");
      setShowTips(false);
      setShowSampleAnswer(false);
    } else {
      setStep("review");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter(q => q.evaluation).length;
  const averageScore = answeredCount > 0
    ? Math.round(questions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0) / answeredCount)
    : 0;

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
        <p className="text-muted-foreground mb-6">Please log in to access Interview Prep.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl relative">
      {/* Loading Overlay */}
      {(isGenerating || isEvaluating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text={isGenerating ? "Preparing" : "Analyzing"} size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/ai-tools" className="hover:text-primary">LaunchPad</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Interview Prep</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Interview Prep Coach</h1>
            <p className="text-muted-foreground">Practice with AI-generated questions and get real-time feedback</p>
          </div>
        </div>
      </div>

      {/* Setup Step */}
      {step === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Practice Session</CardTitle>
            <CardDescription>
              Tell us about the role you&apos;re preparing for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Target Role *</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Google"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
                  <SelectTrigger className="rounded-full" >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="situational">Situational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Questions</SelectItem>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateQuestions} className="w-full rounded-full" disabled={isGenerating}>
              Generate Questions
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Practice Step */}
      {step === "practice" && currentQuestion && (
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {answeredCount} answered
                </span>
              </div>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    currentQuestion.type === "behavioral" ? "default" :
                    currentQuestion.type === "technical" ? "secondary" : "outline"
                  }>
                    {currentQuestion.type}
                  </Badge>
                  <Badge variant="outline" className={
                    currentQuestion.difficulty === "easy" ? "border-green-500 text-green-500" :
                    currentQuestion.difficulty === "medium" ? "border-yellow-500 text-yellow-500" : 
                    "border-red-500 text-red-500"
                  }>
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl mt-4">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Answer Input */}
              {!currentQuestion.evaluation && (
                <>
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here... Use the STAR method for behavioral questions (Situation, Task, Action, Result)"
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setShowTips(!showTips)}
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      {showTips ? "Hide Tips" : "Show Tips"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {showSampleAnswer ? "Hide Sample" : "Sample Answer"}
                    </Button>
                  </div>

                  {showTips && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Tips for this question
                      </h4>
                      <p className="text-sm text-muted-foreground">{currentQuestion.tips}</p>
                    </div>
                  )}

                  {showSampleAnswer && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-medium mb-2">Sample Strong Answer</h4>
                      <p className="text-sm text-muted-foreground">{currentQuestion.sampleAnswer}</p>
                    </div>
                  )}
                </>
              )}

              {/* Evaluation Results */}
              {currentQuestion.evaluation && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Your Score</span>
                    <span className={`text-2xl font-bold ${
                      currentQuestion.evaluation.score >= 80 ? "text-green-500" :
                      currentQuestion.evaluation.score >= 60 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {currentQuestion.evaluation.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="text-sm space-y-1">
                        {currentQuestion.evaluation.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Areas to Improve
                      </h4>
                      <ul className="text-sm space-y-1">
                        {currentQuestion.evaluation.improvements.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium mb-2">Improved Answer</h4>
                    <p className="text-sm text-muted-foreground">{currentQuestion.evaluation.revisedAnswer}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("setup")} className="rounded-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              {!currentQuestion.evaluation ? (
                <Button onClick={handleSubmitAnswer} disabled={isEvaluating || !currentAnswer.trim()} className="rounded-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Evaluate Answer
                </Button>
              ) : (
                <Button onClick={goToNextQuestion}>
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Summary"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Review Step */}
      {step === "review" && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Practice Complete!</h2>
              <p className="text-muted-foreground mb-4">
                You answered {answeredCount} of {questions.length} questions
              </p>
              <div className="text-4xl font-bold text-primary">
                Average Score: {averageScore}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>General Interview Tips for {role}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {generalTips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-1" />
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setStep("setup")}>
              New Practice Session
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
