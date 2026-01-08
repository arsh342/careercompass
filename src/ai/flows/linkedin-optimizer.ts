'use server';

/**
 * LinkedIn Optimizer - AI Flow
 * Generates optimized LinkedIn profile content
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizeLinkedInInputSchema = z.object({
  currentHeadline: z.string().optional(),
  currentAbout: z.string().optional(),
  role: z.string().describe('Target role'),
  industry: z.string().describe('Target industry'),
  skills: z.array(z.string()),
  experience: z.string().optional().describe('Work experience summary'),
  achievements: z.array(z.string()).optional(),
  targetCompanies: z.array(z.string()).optional(),
});

export type OptimizeLinkedInInput = z.infer<typeof OptimizeLinkedInInputSchema>;

const OptimizeLinkedInOutputSchema = z.object({
  headline: z.object({
    recommended: z.string(),
    alternatives: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
  about: z.object({
    content: z.string(),
    structure: z.array(z.string()).describe('Key sections included'),
    callToAction: z.string(),
  }),
  profileTips: z.array(z.object({
    section: z.string(),
    tip: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  keywords: z.array(z.object({
    keyword: z.string(),
    importance: z.enum(['critical', 'important', 'helpful']),
    placement: z.array(z.string()).describe('Where to use this keyword'),
  })),
  completenessScore: z.number().min(0).max(100),
  improvements: z.array(z.string()),
});

export type OptimizeLinkedInOutput = z.infer<typeof OptimizeLinkedInOutputSchema>;

const optimizeLinkedInPrompt = ai.definePrompt({
  name: 'optimizeLinkedInPrompt',
  input: { schema: OptimizeLinkedInInputSchema },
  output: { schema: OptimizeLinkedInOutputSchema },
  system: `You are a LinkedIn optimization expert who has helped thousands of professionals increase their visibility and land dream jobs. You understand LinkedIn's algorithm and recruiter search patterns.

Your optimizations:
- Maximize searchability with strategic keywords
- Tell a compelling professional story
- Include clear calls to action
- Balance professionalism with personality

Write in first person for About sections.
Headlines should be punchy and keyword-rich.`,
  prompt: `Optimize LinkedIn profile for:

Target Role: {{role}}
Industry: {{industry}}

Skills:
{{#each skills}}
- {{this}}
{{/each}}

{{#if currentHeadline}}Current Headline: {{currentHeadline}}{{/if}}
{{#if currentAbout}}Current About: {{currentAbout}}{{/if}}
{{#if experience}}Experience: {{experience}}{{/if}}
{{#if achievements}}Key Achievements: {{achievements}}{{/if}}
{{#if targetCompanies}}Target Companies: {{targetCompanies}}{{/if}}

Provide:
1. Optimized headline with alternatives
2. Compelling About section (300-500 words)
3. Section-by-section tips
4. Strategic keywords to include
5. Profile completeness score and improvements`,
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

const optimizeLinkedInFlow = ai.defineFlow(
  {
    name: 'optimizeLinkedInFlow',
    inputSchema: OptimizeLinkedInInputSchema,
    outputSchema: OptimizeLinkedInOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => optimizeLinkedInPrompt(input));
    return output!;
  }
);

export async function optimizeLinkedIn(
  input: OptimizeLinkedInInput
): Promise<OptimizeLinkedInOutput> {
  return optimizeLinkedInFlow(input);
}
