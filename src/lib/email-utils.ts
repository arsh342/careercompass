"use server";

import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireServerAuthenticatedUser, requireServerRole } from "@/lib/server-auth";

// Lazy initialization to avoid client-side errors
let resend: Resend | null = null;
export async function getResend(): Promise<Resend> {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface EmailDeliveryStatus {
  messageId: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "spam";
  timestamp: string;
}

export async function sendEmailDirect(
  input: EmailInput
): Promise<{ success: boolean; messageId?: string }> {
  await requireServerAuthenticatedUser();

  const { to, subject, body } = input;

  // Rate Limiting Logic - Transactional Emails (3000/month)
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  if (!adminDb) {
    console.warn("adminDb not initialized, skipping rate limit check");
    // continue without rate limit tracking for local testing if admin sdk fails
  } else {
    const countRef = adminDb.collection("monthly_email_counts").doc(monthKey);
    const MONTHLY_TRANSACTIONAL_LIMIT = 3000;

    try {
      const canSend = await adminDb.runTransaction(async (transaction) => {
        const countDoc = await transaction.get(countRef);
        if (!countDoc.exists) {
          transaction.set(countRef, { transactional: 1, broadcasts: 0 });
          return true;
        }
        const currentCount = countDoc.data()?.transactional || 0;
        if (currentCount >= MONTHLY_TRANSACTIONAL_LIMIT) {
          return false;
        }
        transaction.update(countRef, { transactional: FieldValue.increment(1) });
        return true;
      });

      if (!canSend) {
        console.warn(
          `Monthly transactional email limit of ${MONTHLY_TRANSACTIONAL_LIMIT} reached. Email to ${to} not sent.`
        );
        return { success: false, messageId: undefined };
      }
    } catch (e) {
      console.error("Email rate limit transaction failed: ", e);
      return { success: false };
    }
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in .env file");
    return { success: false };
  }

  console.log("[sendEmailDirect] Attempting to send email to:", to);
  console.log("[sendEmailDirect] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  console.log("[sendEmailDirect] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);

  const resendClient = await getResend();
  const { data, error } = await resendClient.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "CareerCompass <onboarding@resend.dev>",
    to: [to],
    subject: subject,
    html: body,
  });

  if (error) {
    console.error("[sendEmailDirect] Resend error:", error);
    return { success: false };
  }

  console.log("[sendEmailDirect] Email sent successfully! ID:", data?.id);
  return { success: true, messageId: data?.id };
}

export async function sendWelcomeEmailDirect(
  to: string,
  name: string
): Promise<boolean> {
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

  const result = await sendEmailDirect({ to, subject, body });
  return result.success;
}

export async function sendApplicationStatusEmailDirect(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  await requireServerRole("employer");
  const result = await sendEmailDirect({ to, subject, body });
  return result.success;
}
