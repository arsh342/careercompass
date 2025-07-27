'use server';

/**
 * @fileOverview A flow to send an email about application status changes.
 *
 * - sendApplicationStatusEmail - Sends an email to a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SendApplicationStatusEmailInput, SendApplicationStatusEmailInputSchema } from './types';
import * as nodemailer from 'nodemailer';

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

    try {
        await transporter.sendMail({
            from: `"CareerCompass" <no-reply@careercompass.com>`,
            to: to,
            subject: subject,
            html: body,
        });
        console.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // We don't rethrow the error to the client, but we log it.
        // In a real app, you might want to have more robust error handling/monitoring.
    }
  }
);
