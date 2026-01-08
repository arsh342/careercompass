'use server';

/**
 * Email Templates - AI Flow
 * Generates professional email templates for job seekers
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateEmailInputSchema = z.object({
  templateType: z.enum([
    'follow-up',
    'thank-you',
    'networking',
    'application',
    'negotiate-salary',
    'accept-offer',
    'decline-offer',
    'withdraw',
    'referral-request',
  ]),
  recipientName: z.string().optional(),
  recipientTitle: z.string().optional(),
  companyName: z.string(),
  jobTitle: z.string().optional(),
  context: z.string().optional().describe('Additional context like interview date, discussion points'),
  userName: z.string(),
  tone: z.enum(['formal', 'professional', 'friendly']).default('professional'),
});

export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

const GenerateEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  tips: z.array(z.string()).describe('Tips for sending this email'),
  timing: z.string().describe('Best time to send this email'),
  alternatives: z.array(z.object({
    subject: z.string(),
    reason: z.string(),
  })).describe('Alternative subject lines'),
});

export type GenerateEmailOutput = z.infer<typeof GenerateEmailOutputSchema>;

const generateEmailPrompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: { schema: GenerateEmailInputSchema },
  output: { schema: GenerateEmailOutputSchema },
  system: `You are an expert career coach who has helped thousands of professionals write compelling emails. Your emails are:
- Professional yet personable
- Concise and action-oriented
- Free of clichés and filler
- Tailored to the specific situation

Write emails that a real human would write - not overly formal or robotic.`,
  prompt: `Generate a {{templateType}} email for {{userName}}.

Company: {{companyName}}
{{#if jobTitle}}Position: {{jobTitle}}{{/if}}
{{#if recipientName}}Recipient: {{recipientName}}{{#if recipientTitle}}, {{recipientTitle}}{{/if}}{{/if}}
{{#if context}}Context: {{context}}{{/if}}
Tone: {{tone}}

Provide:
1. A compelling subject line
2. The full email body (use proper salutation and closing)
3. 3 tips for this type of email
4. Best timing to send
5. 2 alternative subject lines`,
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

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => generateEmailPrompt(input));
    return output!;
  }
);

export async function generateEmail(
  input: GenerateEmailInput
): Promise<GenerateEmailOutput> {
  return generateEmailFlow(input);
}
