'use server';

/**
 * Interview Prep Coach - AI Flow
 * Generates role-specific interview questions and provides feedback
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ============================================
// GENERATE INTERVIEW QUESTIONS
// ============================================

const GenerateQuestionsInputSchema = z.object({
  role: z.string().describe('The job role to prepare for'),
  company: z.string().optional().describe('Target company name'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid'),
  questionType: z.enum(['behavioral', 'technical', 'situational', 'all']).default('all'),
  skills: z.array(z.string()).optional().describe('Key skills to focus on'),
  count: z.number().min(3).max(15).default(10),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(['behavioral', 'technical', 'situational']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tips: z.string().describe('Tips for answering this question'),
    sampleAnswer: z.string().describe('A strong sample answer'),
    followUps: z.array(z.string()).describe('Potential follow-up questions'),
  })),
  generalTips: z.array(z.string()).describe('General interview tips for this role'),
});

export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  system: `You are a senior hiring manager and interview coach with 20+ years of experience at top tech companies. You've conducted thousands of interviews and know exactly what makes candidates stand out.

Your interview questions are:
- Specific and probing, not generic
- Designed to reveal true competency
- Appropriate for the experience level
- Focused on real scenarios

For behavioral questions, use the STAR method framework.
For technical questions, focus on practical application.
For situational questions, create realistic scenarios.`,
  prompt: `Generate {{count}} interview questions for a {{experienceLevel}}-level {{role}} position{{#if company}} at {{company}}{{/if}}.

{{#if skills}}Focus on these skills: {{skills}}{{/if}}

Question types to include: {{questionType}}

For each question:
1. Make it specific to the role
2. Include tips for answering well
3. Provide a strong sample answer
4. Add potential follow-up questions

Also provide 5 general interview tips specific to this role.`,
});

// Helper function to retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.statusCode;
      if (status !== 503 && status !== 429 && attempt > 0) {
        throw error;
      }
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => generateQuestionsPrompt(input));
    return output!;
  }
);

export async function generateInterviewQuestions(
  input: GenerateQuestionsInput
): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

// ============================================
// EVALUATE ANSWER
// ============================================

const EvaluateAnswerInputSchema = z.object({
  question: z.string(),
  questionType: z.enum(['behavioral', 'technical', 'situational']),
  userAnswer: z.string(),
  role: z.string(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
});

export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluateAnswerOutputSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall score 0-100'),
  strengths: z.array(z.string()).describe('What the candidate did well'),
  improvements: z.array(z.string()).describe('Areas to improve'),
  revisedAnswer: z.string().describe('A stronger version of the answer'),
  starAnalysis: z.object({
    situation: z.boolean().describe('Did they set the context?'),
    task: z.boolean().describe('Did they explain their responsibility?'),
    action: z.boolean().describe('Did they describe specific actions?'),
    result: z.boolean().describe('Did they quantify outcomes?'),
  }).optional().describe('STAR method analysis for behavioral questions'),
  tips: z.array(z.string()).describe('Specific tips to improve'),
});

export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;

const evaluateAnswerPrompt = ai.definePrompt({
  name: 'evaluateInterviewAnswerPrompt',
  input: { schema: EvaluateAnswerInputSchema },
  output: { schema: EvaluateAnswerOutputSchema },
  system: `You are an expert interview coach who provides constructive, actionable feedback. You're supportive but honest, helping candidates improve their responses.

Evaluate answers based on:
- Clarity and structure
- Relevance to the question
- Specific examples and metrics
- Confidence and professionalism
- Appropriate depth for the role level

For behavioral questions, analyze using the STAR method.`,
  prompt: `Evaluate this interview answer:

Role: {{experienceLevel}}-level {{role}}
Question Type: {{questionType}}

Question: {{question}}

Candidate's Answer:
{{userAnswer}}

Provide:
1. A score out of 100
2. 2-3 specific strengths
3. 2-3 areas for improvement
4. A revised, stronger version of their answer
5. STAR method analysis (for behavioral questions)
6. 3 actionable tips to improve`,
});

const evaluateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateInterviewAnswerFlow',
    inputSchema: EvaluateAnswerInputSchema,
    outputSchema: EvaluateAnswerOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => evaluateAnswerPrompt(input));
    return output!;
  }
);

export async function evaluateInterviewAnswer(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput> {
  return evaluateAnswerFlow(input);
}
