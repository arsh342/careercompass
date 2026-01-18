"use server";

import { Resend } from "resend";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
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

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "employee" | "employer";
  skills?: string[];
  experience?: string;
  lastLoginAt?: string;
  firstLoginAt?: string;
  preferences?: {
    jobTypes?: string[];
    locations?: string[];
    salaryRange?: string;
  };
}

interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  salary?: string;
  postedAt: string;
  status: "active" | "closed";
}

interface ApplicationStatus {
  applicationId: string;
  jobId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  jobTitle: string;
  companyName: string;
  applicantName: string;
  applicantEmail: string;
}

async function sendEmailWithResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string }> {
  console.log("[sendEmailWithResend] Attempting to send email to:", to);
  
  if (!process.env.RESEND_API_KEY) {
    console.error("[sendEmailWithResend] Missing RESEND_API_KEY in .env file");
    return { success: false };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CareerCompass <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[sendEmailWithResend] Resend error:", error);
      return { success: false };
    }

    console.log("[sendEmailWithResend] Email sent successfully! ID:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[sendEmailWithResend] Error sending email:", error);
    return { success: false };
  }
}

// Track first login and send welcome back email
export async function handleFirstLogin(
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  console.log("[handleFirstLogin] Called for user:", userEmail);
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const now = new Date().toISOString();

      // Check if this is truly the first login
      if (!userData.firstLoginAt) {
        await updateDoc(userRef, {
          firstLoginAt: now,
          lastLoginAt: now,
        });

        // Send first login welcome email
        await sendFirstLoginEmail(userEmail, userName, userData.role);
      } else {
        // Update last login
        await updateDoc(userRef, {
          lastLoginAt: now,
        });
      }
    }
  } catch (error) {
    console.error("[handleFirstLogin] Error:", error);
  }
}

// Send first login welcome email
async function sendFirstLoginEmail(
  email: string,
  name: string,
  role: string
): Promise<void> {
  console.log("[sendFirstLoginEmail] Sending to:", email);
  const welcomeBackContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🎯 Welcome Back to CareerCompass!</h1>
          <p style="color: #64748b; font-size: 18px;">Great to see you're ready to advance your career</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${name},</p>
          <p style="margin: 0 0 15px 0;">Welcome to your CareerCompass dashboard! Now that you're logged in, let's help you discover amazing opportunities.</p>
        </div>

        ${
          role === "employee"
            ? `
        <div style="margin: 30px 0;">
          <h3 style="color: #1e40af; margin-bottom: 15px;">🚀 Your Next Steps:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Complete your profile</strong> - Add skills, experience, and preferences for better matches</li>
            <li><strong>Browse latest opportunities</strong> - Check out jobs posted this week</li>
            <li><strong>Set up job alerts</strong> - Get notified about relevant positions</li>
            <li><strong>Upload your resume</strong> - Let AI help optimize your applications</li>
          </ul>
        </div>
        `
            : `
        <div style="margin: 30px 0;">
          <h3 style="color: #1e40af; margin-bottom: 15px;">🏢 Employer Dashboard Ready:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Post job opportunities</strong> - Reach qualified candidates</li>
            <li><strong>Manage applications</strong> - Review and respond to applicants</li>
            <li><strong>Send targeted campaigns</strong> - Notify candidates about new roles</li>
            <li><strong>Track hiring analytics</strong> - Monitor your recruitment performance</li>
          </ul>
        </div>
        `
        }

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="color: #374151; margin: 0 0 10px 0;">💡 Pro Tip</h4>
          <p style="margin: 0; color: #6b7280;">
            ${
              role === "employee"
                ? "The more detailed your profile, the better our AI can match you with relevant opportunities!"
                : "Post detailed job descriptions to attract the most qualified candidates!"
            }
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Ready to take the next step in your career journey?</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmailWithResend(
      email,
      `🎯 Welcome back, ${name}! Your dashboard is ready`,
      welcomeBackContent
    );
  } catch (error) {
    console.error("[sendFirstLoginEmail] Error:", error);
  }
}

// Handle application status changes
export async function handleApplicationStatusChange(
  applicationStatus: ApplicationStatus
): Promise<void> {
  const { status, applicantEmail, applicantName, jobTitle, companyName } =
    applicationStatus;

  if (status === "approved") {
    await sendApprovalEmail(
      applicantEmail,
      applicantName,
      jobTitle,
      companyName
    );
  } else if (status === "rejected") {
    await sendRejectionEmail(
      applicantEmail,
      applicantName,
      jobTitle,
      companyName
    );
  }
}

// Send approval email
async function sendApprovalEmail(
  email: string,
  name: string,
  jobTitle: string,
  company: string
): Promise<void> {
  const approvalContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin-bottom: 10px;">🎉 Great News!</h1>
          <p style="color: #64748b; font-size: 18px;">Your application has been approved</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${name},</p>
          <p style="margin: 0 0 15px 0;">Congratulations! ${company} has approved your application for the <strong>${jobTitle}</strong> position.</p>
          <p style="margin: 0; color: #047857;">The hiring team will be in touch soon with next steps!</p>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #059669; margin-bottom: 15px;">🚀 What's Next?</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Wait for ${company} to contact you directly about next steps</li>
            <li>Prepare for potential interviews or assessments</li>
            <li>Review the company and role details to ask informed questions</li>
            <li>Continue exploring other opportunities while this process continues</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Wishing you the best in your career journey!</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmailWithResend(
      email,
      `🎉 Your application for ${jobTitle} at ${company} has been approved!`,
      approvalContent
    );
  } catch (error) {
    console.error("[sendApprovalEmail] Error:", error);
  }
}

// Send rejection email with encouragement
async function sendRejectionEmail(
  email: string,
  name: string,
  jobTitle: string,
  company: string
): Promise<void> {
  const rejectionContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin-bottom: 10px;">📧 Application Update</h1>
          <p style="color: #64748b; font-size: 18px;">Thank you for your interest</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${name},</p>
          <p style="margin: 0 0 15px 0;">Thank you for your interest in the <strong>${jobTitle}</strong> position at ${company}. After careful consideration, they have decided to move forward with other candidates.</p>
          <p style="margin: 0; color: #7f1d1d;">While this particular opportunity didn't work out, we're here to help you find the perfect fit!</p>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">🚀 Keep Moving Forward:</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>Don't get discouraged</strong> - The right opportunity is out there for you</li>
            <li><strong>Review similar positions</strong> - We've found other roles that match your profile</li>
            <li><strong>Update your skills</strong> - Consider what additional qualifications might help</li>
            <li><strong>Network actively</strong> - Connect with professionals in your field</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">We're rooting for your success!</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmailWithResend(
      email,
      `Application update for ${jobTitle} at ${company}`,
      rejectionContent
    );
  } catch (error) {
    console.error("[sendRejectionEmail] Error:", error);
  }
}

// Match jobs to user skills and preferences
function matchJobsToUser(user: UserProfile, jobs: JobPosting[]): JobPosting[] {
  const userSkills = user.skills?.map((skill) => skill.toLowerCase()) || [];
  const userPreferences = user.preferences || {};

  return jobs
    .filter((job) => {
      const jobSkills = job.skills?.map((skill) => skill.toLowerCase()) || [];
      const skillMatch = userSkills.some((userSkill) =>
        jobSkills.some(
          (jobSkill) =>
            jobSkill.includes(userSkill) || userSkill.includes(jobSkill)
        )
      );

      const jobTypeMatch =
        !userPreferences.jobTypes?.length ||
        userPreferences.jobTypes.some((type) =>
          job.title.toLowerCase().includes(type.toLowerCase())
        );

      const locationMatch =
        !userPreferences.locations?.length ||
        userPreferences.locations.some((location) =>
          job.location.toLowerCase().includes(location.toLowerCase())
        );

      return skillMatch || (jobTypeMatch && locationMatch);
    })
    .slice(0, 5);
}

// Send personalized weekly digest
async function sendPersonalizedWeeklyDigest(
  user: UserProfile,
  matchedJobs: JobPosting[]
): Promise<void> {
  const jobsHtml = matchedJobs
    .map(
      (job) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fafafa;">
      <h4 style="margin: 0 0 10px 0; color: #1e40af;">${job.title}</h4>
      <p style="margin: 0 0 5px 0; color: #6b7280;"><strong>${
        job.company
      }</strong> • ${job.location}</p>
      <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">${job.description.substring(
        0,
        150
      )}...</p>
      ${
        job.salary
          ? `<p style="margin: 0 0 10px 0; color: #059669; font-weight: bold;">💰 ${job.salary}</p>`
          : ""
      }
      <div style="margin: 10px 0;">
        ${job.skills
          .slice(0, 4)
          .map(
            (skill) =>
              `<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px;">${skill}</span>`
          )
          .join("")}
      </div>
    </div>
  `
    )
    .join("");

  const personalizedContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">🎯 Your Personalized Job Digest</h1>
          <p style="color: #64748b; font-size: 16px;">Jobs matched to your skills posted this week</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">Hi ${user.firstName},</p>
          <p style="margin: 0;">We found <strong>${matchedJobs.length} new opportunities</strong> that match your skills and preferences from this week!</p>
        </div>

        <h3 style="color: #1e40af; margin: 30px 0 15px 0;">🔥 Jobs Matched to Your Profile:</h3>
        ${jobsHtml}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Your next opportunity is just one application away!</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    await sendEmailWithResend(
      user.email,
      `🎯 ${matchedJobs.length} new jobs matched to your skills, ${user.firstName}!`,
      personalizedContent
    );
  } catch (error) {
    console.error("[sendPersonalizedWeeklyDigest] Error:", error);
  }
}

// Generate weekly personalized job recommendations
export async function generateWeeklyPersonalizedDigest(): Promise<void> {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "employee"),
      where("preferences.emailNotifications", "!=", false)
    );

    const usersSnapshot = await getDocs(usersQuery);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const jobsQuery = query(
      collection(db, "jobs"),
      where("postedAt", ">=", oneWeekAgo.toISOString()),
      where("status", "==", "active"),
      orderBy("postedAt", "desc"),
      limit(20)
    );

    const jobsSnapshot = await getDocs(jobsQuery);
    const recentJobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobPosting[];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as UserProfile;
      const matchedJobs = matchJobsToUser(userData, recentJobs);

      if (matchedJobs.length > 0) {
        await sendPersonalizedWeeklyDigest(userData, matchedJobs);
      }
    }
  } catch (error) {
    console.error("[generateWeeklyPersonalizedDigest] Error:", error);
  }
}
