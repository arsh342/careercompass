"use server";

export async function getAdminEmails() {
  const emailsStr = process.env.ADMIN_EMAILS || "";
  return emailsStr.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}
