"use server";

import { getServerAuthenticatedUser } from "@/lib/server-auth";
import { sendEmailDirect, getResend } from "@/lib/email-utils";

// Check if user is an admin based on environment variable (comma-separated list of emails)
// If you don't have this env variable set yet, you might need to add it to your .env file
export async function isAdmin() {
  try {
    const user = await getServerAuthenticatedUser();
    if (!user || !user.email) return false;

    // Check if their email is in the admin list
    const adminEmails = process.env.ADMIN_EMAILS 
        ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
        : [];
    
    // Fallback: If no ADMIN_EMAILS are defined, we securely block everyone by default.
    // The user MUST set ADMIN_EMAILS=their_email@example.com in their .env
    return adminEmails.includes(user.email.toLowerCase());
  } catch (error) {
    return false;
  }
}

export async function sendAdminEmail(formData: FormData) {
  const isAuthorized = await isAdmin();
  
  if (!isAuthorized) {
    return { success: false, error: "Unauthorized access: You are not an admin." };
  }

  const recipientType = formData.get("recipientType") as string;
  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!subject || !body || (!to && recipientType === 'individual')) {
    return { success: false, error: "Required fields are missing." };
  }

  const htmlBody = body.replace(/\n/g, "<br>");
  let recipientEmails: string[] = [];

  try {
    if (recipientType === "all_employers" || recipientType === "all_job_seekers") {
      const { adminDb } = await import("@/lib/firebase-admin");
      const targetRole = recipientType === "all_employers" ? "employer" : "employee";
      
      if (!adminDb) {
        throw new Error("Admin database reference is not initialized.");
      }

      const usersRef = adminDb.collection("users");
      // Depending on how roles are saved, employee might be empty/default, handled below
      const snapshot = await usersRef.where("role", "==", targetRole).get();
      
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.email) recipientEmails.push(data.email);
      });

      if (recipientType === "all_job_seekers") {
         // Also fetch users where role is not explicitly set but have emails
         const allUsersSnapshot = await usersRef.get();
         allUsersSnapshot.forEach((doc: any) => {
            const data = doc.data();
            if (data.email && (!data.role || data.role === "employee") && !recipientEmails.includes(data.email)) {
               recipientEmails.push(data.email);
            }
         });
      }

      if (recipientEmails.length === 0) {
        return { success: false, error: `No users found for ${recipientType}.` };
      }
    } else {
      recipientEmails = [to];
    }

    // Enforce Resend Marketing contact limit of 1000
    const MAX_CONTACTS_LIMIT = 1000;
    let limitWarning = "";
    
    if (recipientEmails.length > MAX_CONTACTS_LIMIT) {
      console.warn(`Attempted to send ${recipientEmails.length} emails, but Contacts limit is ${MAX_CONTACTS_LIMIT}. Truncating list.`);
      recipientEmails = recipientEmails.slice(0, MAX_CONTACTS_LIMIT);
      limitWarning = ` (Limited to ${MAX_CONTACTS_LIMIT} users due to Resend contacts quota)`;
    }

    const resend = await getResend();
    
    // 1. Get the Audience ID (Segment)
    const audiencesRes = await resend.audiences.list();
    if (audiencesRes.error) throw new Error(audiencesRes.error.message);
    const audienceId = audiencesRes.data?.data?.[0]?.id;
    
    if (!audienceId) throw new Error("No Audience found in Resend to add contacts to.");

    // 2. Add Contacts to the Audience (Ignore errors for existing contacts)
    // Run sequentially or in small batches to not overwhelm the API
    console.log(`Adding ${recipientEmails.length} contacts to Resend Audience...`);
    const contactPromises = recipientEmails.map(email => 
      resend.contacts.create({
        email,
        audienceId,
        unsubscribed: false
      }).catch(e => console.error(`Failed to add contact ${email}:`, e)) // swallow duplicate errors
    );
    await Promise.allSettled(contactPromises);

    // 3. Send the Broadcast
    const fromEmail = process.env.RESEND_FROM_EMAIL || "CareerCompass <onboarding@resend.dev>";
    console.log(`Sending Broadcast to Audience ID ${audienceId}...`);
    
    const broadcastRes = await resend.broadcasts.create({
      audienceId,
      from: fromEmail,
      subject,
      html: htmlBody,
    });

    if (broadcastRes.error) {
      // Return the exact error so the user sees the 'must use verified domain' message
      throw new Error(`Broadcast Error: ${broadcastRes.error.message}`);
    }

    if (broadcastRes.data?.id) {
       await resend.broadcasts.send(broadcastRes.data.id);
    }

    return { success: true, message: `Broadcast successfully initiated for ${recipientEmails.length} recipient(s)!${limitWarning}` };

  } catch (err: any) {
    console.error("Mass email error", err);
    return { success: false, error: err.message || "An unexpected error occurred while fetching or sending." };
  }
}
