'use server';

/**
 * Job Match Scorer - AI Flow
 * Scores how well a user matches a job listing
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScoreJobMatchInputSchema = z.object({
  userSkills: z.array(z.string()),
  userExperience: z.string().optional(),
  userEducation: z.string().optional(),
  userLocation: z.string().optional(),
  
  jobTitle: z.string(),
  jobDescription: z.string(),
  jobRequirements: z.array(z.string()).optional(),
  jobLocation: z.string().optional(),
  jobSalary: z.string().optional(),
});

export type ScoreJobMatchInput = z.infer<typeof ScoreJobMatchInputSchema>;

const ScoreJobMatchOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    skills: z.object({
      score: z.number(),
      matched: z.array(z.string()),
      missing: z.array(z.string()),
    }),
    experience: z.object({
      score: z.number(),
      notes: z.string(),
    }),
    education: z.object({
      score: z.number(),
      notes: z.string(),
    }),
    location: z.object({
      score: z.number(),
      notes: z.string(),
    }),
  }),
  recommendation: z.enum(['strong-match', 'good-match', 'potential-match', 'not-recommended']),
  tips: z.array(z.string()).describe('How to improve their match'),
  coverLetterFocus: z.array(z.string()).describe('Key points to emphasize in cover letter'),
});

export type ScoreJobMatchOutput = z.infer<typeof ScoreJobMatchOutputSchema>;

const scoreJobMatchPrompt = ai.definePrompt({
  name: 'scoreJobMatchPrompt',
  input: { schema: ScoreJobMatchInputSchema },
  output: { schema: ScoreJobMatchOutputSchema },
  system: `You are an expert recruiter and career coach. You analyze job matches objectively and provide actionable feedback.

Score based on:
- Skills match (40% weight)
- Experience relevance (30% weight)
- Education fit (15% weight)
- Location compatibility (15% weight)

Be honest but encouraging. Even low matches can be improved.`,
  prompt: `Analyze this job match:

**Candidate Profile:**
Skills: {{userSkills}}
{{#if userExperience}}Experience: {{userExperience}}{{/if}}
{{#if userEducation}}Education: {{userEducation}}{{/if}}
{{#if userLocation}}Location: {{userLocation}}{{/if}}

**Job:**
Title: {{jobTitle}}
{{#if jobLocation}}Location: {{jobLocation}}{{/if}}
{{#if jobSalary}}Salary: {{jobSalary}}{{/if}}

Description:
{{jobDescription}}

{{#if jobRequirements}}
Requirements:
{{#each jobRequirements}}
- {{this}}
{{/each}}
{{/if}}

Provide:
1. Overall match score (0-100)
2. Breakdown by category with specific matches/gaps
3. Match recommendation
4. Tips to improve their match
5. Key points for cover letter`,
});

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
      if (status !== 503 && status !== 429 && attempt > 0) throw error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

const scoreJobMatchFlow = ai.defineFlow(
  {
    name: 'scoreJobMatchFlow',
    inputSchema: ScoreJobMatchInputSchema,
    outputSchema: ScoreJobMatchOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => scoreJobMatchPrompt(input));
    return output!;
  }
);

export async function scoreJobMatch(
  input: ScoreJobMatchInput
): Promise<ScoreJobMatchOutput> {
  return scoreJobMatchFlow(input);
}
