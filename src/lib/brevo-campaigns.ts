"use server";

export interface BrevoContact {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, any>;
}

export interface BrevoCampaign {
  name: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  htmlContent: string;
  recipients?: {
    listIds?: number[];
    exclusionListIds?: number[];
  };
  scheduledAt?: string;
  type?: "classic" | "trigger";
}

export interface BrevoList {
  name: string;
  folderId?: number;
}

// Create a new contact list in Brevo
export async function createBrevoList(
  listData: BrevoList
): Promise<{ success: boolean; listId?: number; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, error: "Brevo API key not configured" };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(listData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to create list" };
    }

    return { success: true, listId: data.id };
  } catch (error) {
    console.error("Error creating Brevo list:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add a contact to Brevo
export async function addBrevoContact(
  contact: BrevoContact,
  listIds?: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, error: "Brevo API key not configured" };
    }

    const contactData = {
      email: contact.email,
      attributes: {
        FIRSTNAME: contact.firstName || "",
        LASTNAME: contact.lastName || "",
        ...contact.attributes,
      },
      listIds: listIds || [],
      updateEnabled: true,
    };

    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(contactData),
    });

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      // Contact might already exist, which is usually okay
      if (response.status === 400 && data.message?.includes("already exists")) {
        return { success: true };
      }
      return { success: false, error: data.message || "Failed to add contact" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding Brevo contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create and send an email campaign
export async function createBrevoCampaign(
  name: string,
  subject: string,
  htmlContent: string,
  listIds: number[]
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
  try {
    const response = await fetch("https://api.brevo.com/v3/emailCampaigns", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        name,
        subject,
        sender: {
          id: 1, // Use the verified sender ID
        },
        type: "classic",
        htmlContent,
        recipients: {
          listIds,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create campaign",
      };
    }

    return { success: true, campaignId: data.id };
  } catch (error) {
    console.error("Error creating Brevo campaign:", error);
    return { success: false, error: "Failed to create campaign" };
  }
}

// Send a campaign immediately
export async function sendBrevoCampaign(
  campaignId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, error: "Brevo API key not configured" };
    }

    const response = await fetch(
      `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || "Failed to send campaign",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending Brevo campaign:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get all contact lists
export async function getBrevoLists(): Promise<{
  success: boolean;
  lists?: any[];
  error?: string;
}> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, error: "Brevo API key not configured" };
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/lists", {
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to get lists" };
    }

    return { success: true, lists: data.lists || [] };
  } catch (error) {
    console.error("Error getting Brevo lists:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// CareerCompass specific functions

// Add all users to a specific campaign list
export async function addUsersToBrevoList(
  users: BrevoContact[],
  listId: number
): Promise<{ success: boolean; added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;

  for (const user of users) {
    const result = await addBrevoContact(user, [listId]);
    if (result.success) {
      added++;
    } else {
      errors.push(`Failed to add ${user.email}: ${result.error}`);
    }
  }

  return { success: errors.length === 0, added, errors };
}

// Create a job notification campaign
export async function createJobNotificationCampaign(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  listId: number,
  scheduledAt?: string
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">New Job Opportunity!</h1>
      <h2 style="color: #1e40af;">${jobTitle}</h2>
      <h3 style="color: #374151;">at ${companyName}</h3>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4>Job Description:</h4>
        <p>${jobDescription}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:9002/opportunities" 
           style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View All Opportunities
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This email was sent because you are subscribed to job notifications from CareerCompass.
        You can update your preferences in your account settings.
      </p>
    </div>
  `;

  return createBrevoCampaign(
    `Job Alert: ${jobTitle} at ${companyName}`,
    `New Job Alert: ${jobTitle} at ${companyName}`,
    htmlContent,
    [listId]
  );
}
