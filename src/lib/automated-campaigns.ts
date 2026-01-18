"use server";

import { Resend } from "resend";
import {
  doc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";

// Lazy initialization to avoid client-side errors
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface AutomatedCampaignResult {
  success: boolean;
  message: string;
  messageId?: string;
}

async function sendEmailWithResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Rate Limiting Logic
  const today = new Date().toISOString().split("T")[0];
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
      console.warn(`Daily email limit of ${DAILY_LIMIT} reached. Email to ${to} not sent.`);
      return { success: false, error: "Daily limit reached" };
    }
  } catch (e) {
    console.error("Email rate limit transaction failed: ", e);
    return { success: false, error: "Rate limit check failed" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in .env file");
    return { success: false, error: "Missing API key" };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CareerCompass <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Send failed" };
  }
}

export async function automateWelcomeCampaign(
  email: string,
  firstName: string,
  lastName: string,
  role: "employee" | "employer"
): Promise<AutomatedCampaignResult> {
  try {
    // Send welcome email directly using Resend
    const welcomeResult = await sendWelcomeEmail(email, firstName, role);

    if (!welcomeResult.success) {
      return {
        success: false,
        message: `Failed to send welcome email: ${welcomeResult.error}`,
      };
    }

    return {
      success: true,
      message: "Welcome email sent successfully",
      messageId: welcomeResult.messageId,
    };
  } catch (error) {
    console.error("Error in automated welcome campaign:", error);
    return {
      success: false,
      message: "Failed to set up automated welcome campaign",
    };
  }
}

async function sendWelcomeEmail(
  email: string,
  firstName: string,
  role: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const welcomeContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Welcome to CareerCompass!</h1>
          <p style="color: #64748b; font-size: 18px;">Your journey to the perfect career starts here</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${firstName},</p>
          <p style="margin: 0 0 15px 0;">Welcome to CareerCompass! We're excited to help you discover amazing career opportunities that match your skills and aspirations.</p>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #1e40af; margin-bottom: 15px;">🚀 What's Next?</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            ${role === "employee" ? `
            <li><strong>Complete your profile</strong> - Add your skills, experience, and preferences</li>
            <li><strong>Browse opportunities</strong> - Explore jobs tailored to your background</li>
            <li><strong>Set up job alerts</strong> - Get notified when perfect matches are posted</li>
            <li><strong>Apply with confidence</strong> - Use our AI-powered application tools</li>
            ` : `
            <li><strong>Post job opportunities</strong> - Reach qualified candidates</li>
            <li><strong>Manage applications</strong> - Review and respond to applicants</li>
            <li><strong>Use AI matching</strong> - Find the best candidates for your roles</li>
            <li><strong>Track hiring analytics</strong> - Monitor your recruitment performance</li>
            `}
          </ul>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="color: #374151; margin: 0 0 10px 0;">💡 Pro Tip</h4>
          <p style="margin: 0; color: #6b7280;">
            ${role === "employee" 
              ? "The more complete your profile, the better we can match you with relevant opportunities. Our AI analyzes your skills and experience to find the perfect fit!"
              : "Post detailed job descriptions to attract the most qualified candidates!"}
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Ready to find your dream job?</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
        </div>
      </body>
    </html>
  `;

  return sendEmailWithResend(
    email,
    `🎉 Welcome to CareerCompass, ${firstName}! Your career journey begins now`,
    welcomeContent
  );
}

export async function scheduleWeeklyJobAlerts(): Promise<void> {
  // This function would be called by a cron job to send weekly job digest campaigns
  // Since Resend doesn't have campaign functionality like Brevo, 
  // you would need to iterate through users and send individual emails
  // or use a batch sending approach
  console.log("Weekly job alerts scheduling - implement with user iteration and Resend batch sending");
}
