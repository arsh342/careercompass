"use server";

import * as nodemailer from "nodemailer";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  increment,
  runTransaction,
} from "firebase/firestore";

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
  const { to, subject, body } = input;

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
      return { success: false };
    }
  } catch (e) {
    console.error("Email rate limit transaction failed: ", e);
    return { success: false };
  }

  if (
    !process.env.BREVO_SMTP_HOST ||
    !process.env.BREVO_SMTP_PORT ||
    !process.env.BREVO_SMTP_USER ||
    !process.env.BREVO_SMTP_PASSWORD
  ) {
    console.error("Missing Brevo SMTP credentials in .env file");
    return { success: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT, 10),
    secure: parseInt(process.env.BREVO_SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: `"CareerCompass" <${process.env.BREVO_SMTP_USER}>`,
      replyTo: `"CareerCompass Support" <${process.env.BREVO_SMTP_USER}>`,
      to: to,
      subject: subject,
      html: body,
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false };
  }
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
  const result = await sendEmailDirect({ to, subject, body });
  return result.success;
}
