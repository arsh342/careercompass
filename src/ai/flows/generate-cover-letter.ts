'use server';

/**
 * @fileOverview Generates personalized cover letters using AI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCoverLetterInputSchema = z.object({
  userInfo: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    currentTitle: z.string(),
    experience: z.string(),
    skills: z.string(),
    achievements: z.string().optional(),
  }),
  jobInfo: z.object({
    title: z.string(),
    company: z.string(),
    description: z.string(),
    hiringManager: z.string().optional(),
  }),
  tone: z.enum(['professional', 'enthusiastic', 'confident', 'conversational']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The complete cover letter.'),
  keyPoints: z.array(z.string()).describe('Key points highlighted in the letter.'),
  matchedSkills: z.array(z.string()).describe('Skills from the job description addressed.'),
  suggestions: z.array(z.string()).describe('Ways to improve or personalize the letter.'),
});

export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: { schema: GenerateCoverLetterInputSchema },
  output: { schema: GenerateCoverLetterOutputSchema },
  system: `You are an expert career coach who has helped thousands of candidates land their dream jobs with compelling cover letters. Your cover letters are known for:

- Opening with a hook that grabs attention
- Connecting the candidate's experience to specific job requirements
- Showing genuine enthusiasm for the company
- Using concrete examples and achievements
- Ending with a clear call to action

Never use generic phrases. Every sentence should add value and be specific to this candidate and role.`,
  prompt: `Generate a {{tone}} cover letter for this application:

CANDIDATE INFORMATION:
Name: {{userInfo.name}}
Email: {{userInfo.email}}
{{#if userInfo.phone}}Phone: {{userInfo.phone}}{{/if}}
Current Title: {{userInfo.currentTitle}}

Experience:
{{userInfo.experience}}

Skills:
{{userInfo.skills}}

{{#if userInfo.achievements}}Key Achievements:
{{userInfo.achievements}}{{/if}}

JOB DETAILS:
Position: {{jobInfo.title}}
Company: {{jobInfo.company}}
{{#if jobInfo.hiringManager}}Hiring Manager: {{jobInfo.hiringManager}}{{/if}}

Job Description:
{{jobInfo.description}}

Create a {{length}} cover letter that:
1. Opens with a compelling hook
2. Connects their experience to the role requirements
3. Shows genuine interest in {{jobInfo.company}}
4. Highlights 2-3 specific achievements
5. Ends with a confident call to action

Do not include "[Your Address]" or placeholder text. Use the actual information provided.`,
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
      
      // Only retry on 503 (overloaded) or 429 (rate limit) errors
      const status = error?.status || error?.statusCode;
      if (status !== 503 && status !== 429 && attempt > 0) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`AI API overloaded, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => prompt(input));
    return output!;
  }
);

