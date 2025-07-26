'use server';

/**
 * @fileOverview Generates a summary of a user's profile using AI.
 *
 * - generateProfileSummary - A function that generates a profile summary.
 * - GenerateProfileSummaryInput - The input type for the generateProfileSummary function.
 * - GenerateProfileSummaryOutput - The return type for the generateProfileSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProfileSummaryInputSchema = z.object({
  education: z.string().describe('The user\'s education history.'),
  skills: z.string().describe('The user\'s skills.'),
  interests: z.string().describe('The user\'s interests.'),
  careerGoals: z.string().describe('The user\'s career goals.'),
});
export type GenerateProfileSummaryInput = z.infer<
  typeof GenerateProfileSummaryInputSchema
>;

const GenerateProfileSummaryOutputSchema = z.object({
  summary: z.string().describe('A compelling narrative summary of the user profile.'),
});
export type GenerateProfileSummaryOutput = z.infer<
  typeof GenerateProfileSummaryOutputSchema
>;

export async function generateProfileSummary(
  input: GenerateProfileSummaryInput
): Promise<GenerateProfileSummaryOutput> {
  return generateProfileSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProfileSummaryPrompt',
  input: {schema: GenerateProfileSummaryInputSchema},
  output: {schema: GenerateProfileSummaryOutputSchema},
  prompt: `You are a career advisor. You will generate a compelling narrative summary of the user profile.

Education: {{{education}}}
Skills: {{{skills}}}
Interests: {{{interests}}}
Career Goals: {{{careerGoals}}}

Summary:`,
});

const generateProfileSummaryFlow = ai.defineFlow(
  {
    name: 'generateProfileSummaryFlow',
    inputSchema: GenerateProfileSummaryInputSchema,
    outputSchema: GenerateProfileSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
