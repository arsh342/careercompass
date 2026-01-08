'use server';

/**
 * Salary Negotiator - AI Flow
 * Provides salary insights and negotiation strategies
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SalaryNegotiationInputSchema = z.object({
  role: z.string().describe('Job title'),
  company: z.string().optional().describe('Company name'),
  location: z.string().describe('Job location'),
  experienceYears: z.number().describe('Years of experience'),
  currentSalary: z.number().optional().describe('Current salary'),
  offeredSalary: z.number().optional().describe('Offered salary'),
  skills: z.array(z.string()).optional().describe('Key skills'),
  industry: z.string().optional().describe('Industry sector'),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  negotiationType: z.enum(['new-offer', 'raise', 'counter-offer', 'research']).default('research'),
});

export type SalaryNegotiationInput = z.infer<typeof SalaryNegotiationInputSchema>;

const SalaryNegotiationOutputSchema = z.object({
  marketData: z.object({
    lowRange: z.number(),
    midRange: z.number(),
    highRange: z.number(),
    currency: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    factors: z.array(z.string()).describe('Factors affecting salary'),
  }),
  analysis: z.object({
    currentVsMarket: z.string().optional().describe('How current salary compares'),
    offerVsMarket: z.string().optional().describe('How offer compares'),
    recommendation: z.string(),
    targetSalary: z.number(),
    minimumAcceptable: z.number(),
  }),
  negotiationScript: z.object({
    opening: z.string().describe('How to start the conversation'),
    keyPoints: z.array(z.string()).describe('Points to emphasize'),
    responses: z.array(z.object({
      objection: z.string(),
      response: z.string(),
    })).describe('Common objections and responses'),
    closing: z.string().describe('How to close the negotiation'),
  }),
  alternativeCompensation: z.array(z.object({
    item: z.string(),
    typicalValue: z.string(),
    negotiability: z.enum(['high', 'medium', 'low']),
  })).describe('Other things to negotiate'),
  tips: z.array(z.string()),
});

export type SalaryNegotiationOutput = z.infer<typeof SalaryNegotiationOutputSchema>;

const salaryNegotiationPrompt = ai.definePrompt({
  name: 'salaryNegotiationPrompt',
  input: { schema: SalaryNegotiationInputSchema },
  output: { schema: SalaryNegotiationOutputSchema },
  system: `You are an expert salary negotiation coach and compensation analyst. You have access to comprehensive salary data across industries and regions.

Your advice is:
- Data-driven with realistic salary ranges
- Specific to role, location, and experience level
- Actionable with exact scripts to use
- Supportive but realistic

For salary ranges, provide numbers appropriate to the location's market.
For negotiation scripts, write natural, professional dialogue.`,
  prompt: `Provide salary negotiation guidance for:

Role: {{role}}
{{#if company}}Company: {{company}}{{/if}}
Location: {{location}}
Experience: {{experienceYears}} years
{{#if industry}}Industry: {{industry}}{{/if}}
{{#if companySize}}Company Size: {{companySize}}{{/if}}

{{#if currentSalary}}Current Salary: {{currentSalary}}{{/if}}
{{#if offeredSalary}}Offered Salary: {{offeredSalary}}{{/if}}

{{#if skills}}Key Skills: {{skills}}{{/if}}

Negotiation Type: {{negotiationType}}

Provide:
1. Market salary data (low/mid/high range)
2. Analysis of their situation
3. Word-for-word negotiation script
4. Alternative compensation to negotiate
5. Key tips for success`,
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

const salaryNegotiationFlow = ai.defineFlow(
  {
    name: 'salaryNegotiationFlow',
    inputSchema: SalaryNegotiationInputSchema,
    outputSchema: SalaryNegotiationOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => salaryNegotiationPrompt(input));
    return output!;
  }
);

export async function getSalaryNegotiationAdvice(
  input: SalaryNegotiationInput
): Promise<SalaryNegotiationOutput> {
  return salaryNegotiationFlow(input);
}
