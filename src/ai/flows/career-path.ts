'use server';

/**
 * Career Path Visualization - AI Flow
 * Generates a career progression map with skill milestones and timelines.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ============================================
// GENERATE CAREER PATH
// ============================================

const CareerPathInputSchema = z.object({
  currentRole: z.string().describe('Current job title or role'),
  targetRole: z.string().describe('Desired future role'),
  currentSkills: z.array(z.string()).describe('Skills the user currently has'),
  yearsOfExperience: z.number().min(0).max(50).default(0),
  industry: z.string().optional().describe('Target industry'),
});

export type CareerPathInput = z.infer<typeof CareerPathInputSchema>;

const CareerPathOutputSchema = z.object({
  summary: z.string().describe('Brief overview of the career path'),
  estimatedTimeYears: z.number().describe('Estimated years to reach target role'),
  steps: z.array(z.object({
    order: z.number(),
    title: z.string().describe('Role title at this stage'),
    description: z.string().describe('What this stage involves'),
    durationMonths: z.number().describe('Typical time spent in this stage'),
    skills: z.array(z.object({
      name: z.string(),
      level: z.enum(['learn', 'strengthen', 'master']),
    })).describe('Skills to develop at this stage'),
    milestones: z.array(z.string()).describe('Key achievements to unlock this stage'),
    salaryRange: z.string().optional().describe('Typical salary range (USD)'),
  })).describe('Career progression steps from current to target'),
  quickWins: z.array(z.object({
    action: z.string(),
    impact: z.string(),
    timeframe: z.string(),
  })).describe('Immediate actions to start progressing'),
  alternativePaths: z.array(z.object({
    path: z.string(),
    description: z.string(),
  })).optional().describe('Alternative career trajectories'),
});

export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>;

const careerPathPrompt = ai.definePrompt({
  name: 'careerPathPrompt',
  input: { schema: CareerPathInputSchema },
  output: { schema: CareerPathOutputSchema },
  system: `You are an expert career strategist with 20+ years advising professionals across industries. You have deep knowledge of career trajectories, skill requirements, and industry trends.

Your career path recommendations are:
- Realistic and achievable
- Based on actual industry career progressions
- Specific about skills, timelines, and milestones
- Tailored to the individual's current position
- Salary-aware with realistic ranges`,
  prompt: `Create a detailed career progression path:

Current Role: {{currentRole}}
Target Role: {{targetRole}}
Years of Experience: {{yearsOfExperience}}
{{#if industry}}Industry: {{industry}}{{/if}}

Current Skills:
{{#each currentSkills}}
- {{this}}
{{/each}}

Provide:
1. A summary of the career path
2. Estimated total years to reach target
3. Step-by-step progression (3-6 stages) from current to target role, each with:
   - Role title and description
   - Duration in months
   - Skills to develop (learn / strengthen / master)
   - Key milestones to achieve
   - Typical salary range
4. 3-5 quick wins they can start immediately
5. 1-2 alternative career paths they could consider`,
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

const careerPathFlow = ai.defineFlow(
  {
    name: 'careerPathFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: CareerPathOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => careerPathPrompt(input));
    return output!;
  }
);

export async function generateCareerPath(
  input: CareerPathInput
): Promise<CareerPathOutput> {
  return careerPathFlow(input);
}
