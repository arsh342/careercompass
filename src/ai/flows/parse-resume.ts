'use server';

/**
 * @fileOverview A flow to parse a resume and extract structured information.
 *
 * - parseResume - Parses a resume file to extract user profile information.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  education: z.string().describe('The user\'s education history, including degrees and institutions.'),
  skills: z.string().describe('A comma-separated list of the user\'s skills.'),
  interests: z.string().describe('A comma-separated list of the user\'s interests or hobbies.'),
  careerGoals: z.string().describe('A summary of the user\'s career goals or professional objective.'),
  employmentHistory: z.string().describe('A detailed summary of the user\'s past work experience, including roles, companies, and durations.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;


export async function parseResume(
  input: ParseResumeInput
): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: { schema: ParseResumeInputSchema },
  output: { schema: ParseResumeOutputSchema },
  system: `You are an expert HR assistant with extensive experience in parsing resumes. Your task is to accurately extract information from the provided resume text and structure it into the specified JSON format.

  - Carefully analyze the entire resume content.
  - Extract the 'education', 'skills', 'interests', 'careerGoals', and 'employmentHistory' sections.
  - For 'skills' and 'interests', provide comma-separated lists.
  - For 'employmentHistory', synthesize the work experience into a coherent, well-formatted text block, preserving key details like company names, job titles, and dates.
  - If a section is not explicitly present in the resume, leave the corresponding field as an empty string.`,
  prompt: `Please parse the following resume:
  
  Resume Content:
  {{media url=resumeDataUri}}
  `,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
