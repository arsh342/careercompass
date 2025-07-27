'use server';

/**
 * @fileOverview A flow to send a welcome email to a new user.
 *
 * - sendWelcomeEmail - Sends a welcome email to a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as nodemailer from 'nodemailer';

const SendWelcomeEmailInputSchema = z.object({
  to: z.string().email().describe('The email address of the recipient.'),
  name: z.string().describe('The name of the user.'),
});
export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;


export async function sendWelcomeEmail(
  input: SendWelcomeEmailInput
): Promise<void> {
  return sendWelcomeEmailFlow(input);
}

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, name }) => {
    
    if (!process.env.BREVO_SMTP_HOST || !process.env.BREVO_SMTP_PORT || !process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASSWORD) {
        console.error('Missing Brevo SMTP credentials in .env file');
        throw new Error('Email service is not configured.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT, 10),
      secure: parseInt(process.env.BREVO_SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    const subject = 'Welcome to CareerCompass!';
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to CareerCompass! We're thrilled to have you join our community.</p>
        <p>Get started by completing your profile to receive personalized job recommendations.</p>
        <p>Best,</p>
        <p>The CareerCompass Team</p>
    `;

    try {
        await transporter.sendMail({
            from: `"CareerCompass" <no-reply@careercompass.com>`,
            to: to,
            subject: subject,
            html: body,
        });
        console.log(`Welcome email sent to ${to}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
  }
);
