import { z } from 'genkit';

export const SendApplicationStatusEmailInputSchema = z.object({
  to: z.string().email().describe('The email address of the recipient.'),
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});
export type SendApplicationStatusEmailInput = z.infer<typeof SendApplicationStatusEmailInputSchema>;
