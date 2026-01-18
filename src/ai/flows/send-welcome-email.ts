"use server";

/**
 * @fileOverview A flow to send a welcome email to a new user.
 *
 * - sendWelcomeEmail - Sends a welcome email to a user.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { Resend } from "resend";
import { db } from "@/lib/firebase";
import {
  doc,
  increment,
  runTransaction,
} from "firebase/firestore";

// Lazy initialization to avoid client-side errors
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

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
        return;
      }
    } catch (e) {
      console.error("Email rate limit transaction failed: ", e);
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY in .env file");
      throw new Error("Email service is not configured.");
    }

    const subject = "Welcome to CareerCompass!";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CareerCompass!</h2>
        <p>Hi ${name},</p>
        <p>Welcome to CareerCompass! We're thrilled to have you join our community.</p>
        <p>Get started by completing your profile to receive personalized job recommendations.</p>
        <p>Best,</p>
        <p>The CareerCompass Team</p>
      </div>
    `;

    try {
      const { data, error } = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || "CareerCompass <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: body,
      });

      if (error) {
        console.error("Resend error:", error);
        return;
      }

      console.log("Welcome email sent successfully:", data?.id);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }
);
