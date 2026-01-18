"use server";

/**
 * @fileOverview A flow to send an email about application status changes.
 *
 * - sendApplicationStatusEmail - Sends an email to a user.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import {
  SendApplicationStatusEmailInput,
  SendApplicationStatusEmailInputSchema,
} from "./types";
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

export async function sendApplicationStatusEmail(
  input: SendApplicationStatusEmailInput
): Promise<void> {
  return sendApplicationStatusEmailFlow(input);
}

const sendApplicationStatusEmailFlow = ai.defineFlow(
  {
    name: "sendApplicationStatusEmailFlow",
    inputSchema: SendApplicationStatusEmailInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, subject, body }) => {
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
          `Daily email limit of ${DAILY_LIMIT} reached. Email to ${to} not sent.`
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

      console.log("Application status email sent successfully:", data?.id);
    } catch (error) {
      console.error("Error sending application status email:", error);
    }
  }
);
