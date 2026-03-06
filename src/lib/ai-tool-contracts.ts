export interface CareerPathOutput {
  summary: string;
  estimatedTimeYears: number;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    durationMonths: number;
    skills: Array<{
      name: string;
      level: "learn" | "strengthen" | "master";
    }>;
    milestones: string[];
    salaryRange?: string;
  }>;
  quickWins: Array<{
    action: string;
    impact: string;
    timeframe: string;
  }>;
  alternativePaths?: Array<{
    path: string;
    description: string;
  }>;
}

export interface GenerateCoverLetterOutput {
  coverLetter: string;
  keyPoints: string[];
  matchedSkills: string[];
  suggestions: string[];
}

export type TemplateType =
  | "follow-up"
  | "thank-you"
  | "networking"
  | "application"
  | "negotiate-salary"
  | "accept-offer"
  | "decline-offer"
  | "withdraw"
  | "referral-request";

export interface GenerateEmailOutput {
  subject: string;
  body: string;
  tips: string[];
  timing: string;
  alternatives: Array<{
    subject: string;
    reason: string;
  }>;
}

export interface GenerateQuestionsOutput {
  questions: Array<{
    id: string;
    question: string;
    type: "behavioral" | "technical" | "situational";
    difficulty: "easy" | "medium" | "hard";
    tips: string;
    sampleAnswer: string;
    followUps: string[];
  }>;
  generalTips: string[];
}

export interface EvaluateAnswerOutput {
  score: number;
  strengths: string[];
  improvements: string[];
  revisedAnswer: string;
  starAnalysis?: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  tips: string[];
}

export interface OptimizeLinkedInOutput {
  headline: {
    recommended: string;
    alternatives: string[];
    keywords: string[];
  };
  about: {
    content: string;
    structure: string[];
    callToAction: string;
  };
  profileTips: Array<{
    section: string;
    tip: string;
    priority: "high" | "medium" | "low";
  }>;
  keywords: Array<{
    keyword: string;
    importance: "critical" | "important" | "helpful";
    placement: string[];
  }>;
  completenessScore: number;
  improvements: string[];
}

export interface SalaryNegotiationOutput {
  marketData: {
    lowRange: number;
    midRange: number;
    highRange: number;
    currency: string;
    confidence: "high" | "medium" | "low";
    factors: string[];
  };
  analysis: {
    currentVsMarket?: string;
    offerVsMarket?: string;
    recommendation: string;
    targetSalary: number;
    minimumAcceptable: number;
  };
  negotiationScript: {
    opening: string;
    keyPoints: string[];
    responses: Array<{
      objection: string;
      response: string;
    }>;
    closing: string;
  };
  alternativeCompensation: Array<{
    item: string;
    typicalValue: string;
    negotiability: "high" | "medium" | "low";
  }>;
  tips: string[];
}

export interface AnalyzeSkillGapOutput {
  overallMatch: number;
  matchedSkills: Array<{
    skill: string;
    strength: "strong" | "moderate" | "basic";
    notes?: string;
  }>;
  missingSkills: Array<{
    skill: string;
    priority: "critical" | "important" | "nice-to-have";
    learningTime: string;
    resources: Array<{
      name: string;
      type: "course" | "book" | "tutorial" | "certification" | "project";
      url?: string;
      provider?: string;
    }>;
  }>;
  experienceGaps: string[];
  recommendations: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    timeframe: string;
  }>;
  careerPath?: {
    currentLevel: string;
    targetLevel: string;
    stepsToTarget: string[];
  };
}

export interface SavedJobDescription {
  id: string;
  title: string;
  text: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumeMatchSuggestion {
  section: "summary" | "skills" | "experience" | "education" | "general";
  priority: "high" | "medium" | "low";
  currentFocus: string;
  suggestion: string;
  rationale: string;
}

export interface ResumeMatchAnalysisOutput {
  jobTitle: string;
  jobDescriptionText: string;
  parsedResume: {
    education: string;
    skills: string;
    interests: string;
    careerGoals: string;
    employmentHistory: string;
  };
  match: {
    overallScore: number;
    breakdown: {
      skills: {
        score: number;
        matched: string[];
        missing: string[];
      };
      experience: {
        score: number;
        notes: string;
      };
      education: {
        score: number;
        notes: string;
      };
      location: {
        score: number;
        notes: string;
      };
    };
    recommendation: "strong-match" | "good-match" | "potential-match" | "not-recommended";
    tips: string[];
    coverLetterFocus: string[];
  };
  suggestions: {
    summary: string;
    keywordTargets: string[];
    quickWins: string[];
    sectionSuggestions: ResumeMatchSuggestion[];
  };
}
