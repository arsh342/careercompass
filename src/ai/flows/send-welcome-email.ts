"use server";

/**
 * @fileOverview A flow to send a welcome email to a new user.
 *
 * - sendWelcomeEmail - Sends a welcome email to a user.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import * as nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  increment,
  runTransaction,
} from "firebase/firestore";

const SendWelcomeEmailInputSchema = z.object({
  to: z.string().email().describe("The email address of the recipient."),
  name: z.string().describe("The name of the user."),
});
export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

export async function sendWelcomeEmail(
  input: SendWelcomeEmailInput
): Promise<void> {
  return sendWelcomeEmailFlow(input);
}

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: "sendWelcomeEmailFlow",
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, name }) => {
    // Rate Limiting Logic
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const countRef = doc(db, "daily_email_counts", today);
    const DAILY_LIMIT = 300;

    try {
      const canSend = await runTransaction(db, async (transaction) => {
        const countDoc = await transaction.get(countRef);
        if (!countDoc.exists()) {
          transaction.set(countRef, { count: 1 });
          return true;
        }
        const currentCount = countDoc.data().count;
        if (currentCount >= DAILY_LIMIT) {
          return false;
        }
        transaction.update(countRef, { count: increment(1) });
        return true;
      });

      if (!canSend) {
        console.warn(
          `Daily email limit of ${DAILY_LIMIT} reached. Welcome email to ${to} not sent.`
        );
        return; // Stop execution if limit is reached
      }
    } catch (e) {
      console.error("Email rate limit transaction failed: ", e);
      // Decide if you want to proceed or not. For safety, we'll stop.
      return;
    }

    if (
      !process.env.BREVO_SMTP_HOST ||
      !process.env.BREVO_SMTP_USER ||
      !process.env.BREVO_SMTP_PASS
    ) {
      console.error("Missing Brevo SMTP credentials in .env file");
      throw new Error("Email service is not configured.");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT || "587", 10),
      secure: parseInt(process.env.BREVO_SMTP_PORT || "587", 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });

    const subject = "Welcome to CareerCompass!";
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to CareerCompass! We're thrilled to have you join our community.</p>
        <p>Get started by completing your profile to receive personalized job recommendations.</p>
        <p>Best,</p>
        <p>The CareerCompass Team</p>
    `;

    try {
      const result = await transporter.sendMail({
        from: `"CareerCompass" <no-reply@careercompass.com>`,
        to: to,
        subject: subject,
        html: body,
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      console.error(
        "Welcome email error details:",
        JSON.stringify(error, null, 2)
      );
    }
  }
);
