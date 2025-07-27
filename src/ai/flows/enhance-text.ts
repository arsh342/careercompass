'use server';

/**
 * @fileOverview A flow to enhance user-provided text using AI.
 *
 * - enhanceText - A function that enhances a given text based on its context.
 * - EnhanceTextInput - The input type for the enhanceText function.
 * - EnhanceTextOutput - The return type for the enhanceText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceTextInputSchema = z.object({
  text: z.string().describe('The text to be enhanced.'),
  context: z
    .string()
    .describe(
      'The context of the text, e.g., "cover letter", "job description", "career goals".'
    ),
});
export type EnhanceTextInput = z.infer<typeof EnhanceTextInputSchema>;

const EnhanceTextOutputSchema = z.object({
  enhancedText: z.string().describe('The AI-enhanced version of the text.'),
});
export type EnhanceTextOutput = z.infer<typeof EnhanceTextOutputSchema>;

export async function enhanceText(
  input: EnhanceTextInput
): Promise<EnhanceTextOutput> {
  return enhanceTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceTextPrompt',
  input: { schema: EnhanceTextInputSchema },
  output: { schema: EnhanceTextOutputSchema },
  system: `You are an expert copywriter and career coach. Your task is to enhance the provided text to make it more professional, clear, and compelling. Rewrite the text to be more impactful, but preserve the core meaning. Adjust the tone to be appropriate for the given context. Do not add any markdown or formatting.`,
  prompt: `Please enhance the following text which is for a "{{context}}":

  Original Text:
  {{{text}}}
`,
});

const enhanceTextFlow = ai.defineFlow(
  {
    name: 'enhanceTextFlow',
    inputSchema: EnhanceTextInputSchema,
    outputSchema: EnhanceTextOutputSchema,
  },
  async (input) => {
    if (!input.text.trim()) {
        return { enhancedText: '' };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
