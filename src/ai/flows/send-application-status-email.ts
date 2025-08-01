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
import * as nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  increment,
  runTransaction,
} from "firebase/firestore";

export async function sendApplicationStatusEmail(
  input: SendApplicationStatusEmailInput
): Promise<void> {
  // Call the flow directly instead of using the wrapper
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
        return; // Stop execution if limit is reached
      }
    } catch (e) {
      console.error("Email rate limit transaction failed: ", e);
      // Decide if you want to proceed or not. For safety, we'll stop.
      return;
    }

    console.log("=== EMAIL DEBUG INFO ===");
    console.log("BREVO_SMTP_HOST:", process.env.BREVO_SMTP_HOST);
    console.log("BREVO_SMTP_PORT:", process.env.BREVO_SMTP_PORT);
    console.log("BREVO_SMTP_USER:", process.env.BREVO_SMTP_USER);
    console.log(
      "BREVO_SMTP_PASSWORD exists:",
      !!process.env.BREVO_SMTP_PASSWORD
    );
    console.log("Sending email to:", to);
    console.log("Email subject:", subject);
    console.log("=======================");

    if (
      !process.env.BREVO_SMTP_HOST ||
      !process.env.BREVO_SMTP_PORT ||
      !process.env.BREVO_SMTP_USER ||
      !process.env.BREVO_SMTP_PASSWORD
    ) {
      console.error("Missing Brevo SMTP credentials in .env file");
      throw new Error("Email service is not configured.");
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
      console.log("Attempting to send email...");
      const result = await transporter.sendMail({
        from: `"CareerCompass" <no-reply@careercompass.com>`,
        to: to,
        subject: subject,
        html: body,
      });
      console.log(`Email sent successfully to ${to} with subject: ${subject}`);
      console.log("Email result:", result);
    } catch (error) {
      console.error("Error sending email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      // We don't rethrow the error to the client, but we log it.
      // In a real app, you might want to have more robust error handling/monitoring.
    }
  }
);
