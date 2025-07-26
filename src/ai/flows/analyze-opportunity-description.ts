'use server';

/**
 * @fileOverview A flow to analyze an opportunity description and extract key skills and qualifications.
 *
 * - analyzeOpportunityDescription - Analyzes the opportunity description to identify key skills and qualifications.
 * - AnalyzeOpportunityDescriptionInput - The input type for the analyzeOpportunityDescription function.
 * - AnalyzeOpportunityDescriptionOutput - The return type for the analyzeOpportunityDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeOpportunityDescriptionInputSchema = z.object({
  description: z.string().describe('The opportunity description to analyze.'),
});
export type AnalyzeOpportunityDescriptionInput = z.infer<typeof AnalyzeOpportunityDescriptionInputSchema>;

const AnalyzeOpportunityDescriptionOutputSchema = z.object({
  skills: z
    .array(z.string())
    .describe('The list of key skills and qualifications required for the opportunity.'),
  fitAnalysis: z
    .string()
    .describe('A brief analysis of how well the opportunity fits the user based on the description.'),
});
export type AnalyzeOpportunityDescriptionOutput = z.infer<typeof AnalyzeOpportunityDescriptionOutputSchema>;

export async function analyzeOpportunityDescription(
  input: AnalyzeOpportunityDescriptionInput
): Promise<AnalyzeOpportunityDescriptionOutput> {
  return analyzeOpportunityDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOpportunityDescriptionPrompt',
  input: {schema: AnalyzeOpportunityDescriptionInputSchema},
  output: {schema: AnalyzeOpportunityDescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing opportunity descriptions and extracting key skills and qualifications.

  Analyze the following opportunity description and identify the key skills and qualifications required. Also, provide a brief analysis of how well the opportunity fits the user based on the description.

  Opportunity Description: {{{description}}}

  Skills and Qualifications:
  {{#each skills}}
  - {{this}}
  {{/each}}

  Fit Analysis: {{{fitAnalysis}}}`,
  system: `You are an expert at distilling job descriptions into a list of key skills and qualifications. The skills should be specific, and not too broad. You should also provide a fit analysis which assesses whether the candidate is a good fit for the role.`, 
});

const analyzeOpportunityDescriptionFlow = ai.defineFlow(
  {
    name: 'analyzeOpportunityDescriptionFlow',
    inputSchema: AnalyzeOpportunityDescriptionInputSchema,
    outputSchema: AnalyzeOpportunityDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
