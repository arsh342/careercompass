'use server';

/**
 * @fileOverview A flow to send an email about application status changes.
 *
 * - sendApplicationStatusEmail - Sends an email to a user.
 * - SendApplicationStatusEmailInput - The input type for the sendApplicationStatusEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SendApplicationStatusEmailInputSchema = z.object({
  to: z.string().email().describe('The email address of the recipient.'),
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});
export type SendApplicationStatusEmailInput = z.infer<typeof SendApplicationStatusEmailInputSchema>;

export async function sendApplicationStatusEmail(
  input: SendApplicationStatusEmailInput
): Promise<void> {
  return sendApplicationStatusEmailFlow(input);
}

const sendApplicationStatusEmailFlow = ai.defineFlow(
  {
    name: 'sendApplicationStatusEmailFlow',
    inputSchema: SendApplicationStatusEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, subject, body }) => {
    // In a real application, you would integrate with an email sending service
    // like SendGrid, Mailgun, or AWS SES here.
    // For this example, we'll just log the email to the console to simulate it being sent.
    console.log('--- SIMULATING EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(body);
    console.log('------------------------');

    // This flow doesn't return anything.
    return;
  }
);
