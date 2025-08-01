import {
  addBrevoContact,
  createJobNotificationCampaign,
} from "./brevo-campaigns";

interface AutomatedCampaignResult {
  success: boolean;
  message: string;
  listId?: number;
  campaignId?: number;
}

export async function automateWelcomeCampaign(
  email: string,
  firstName: string,
  lastName: string,
  role: "employee" | "employer"
): Promise<AutomatedCampaignResult> {
  try {
    // Determine which list to add the user to based on role
    const listId = role === "employee" ? 5 : 3; // 5 = CareerCompass Job Seekers, 3 = identified_contacts

    // Add contact to appropriate list
    const contactResult = await addBrevoContact(
      {
        email,
        firstName,
        lastName,
        attributes: {
          ROLE: role.toUpperCase(),
          SIGNUP_DATE: new Date().toISOString().split("T")[0],
          CAMPAIGN_ELIGIBLE: "YES",
        },
      },
      [listId]
    );

    if (!contactResult.success) {
      return {
        success: false,
        message: `Failed to add contact to list: ${contactResult.error}`,
      };
    }

    // For employees, also add them to a welcome campaign queue
    if (role === "employee") {
      // Create a personalized welcome campaign
      const welcomeCampaignResult = await createWelcomeCampaign(
        email,
        firstName,
        listId
      );

      return {
        success: true,
        message: "User added to welcome campaign successfully",
        listId,
        campaignId: welcomeCampaignResult.campaignId,
      };
    }

    return {
      success: true,
      message: "User added to contact list successfully",
      listId,
    };
  } catch (error) {
    console.error("Error in automated welcome campaign:", error);
    return {
      success: false,
      message: "Failed to set up automated welcome campaign",
    };
  }
}

async function createWelcomeCampaign(
  email: string,
  firstName: string,
  listId: number
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
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
            <li><strong>Complete your profile</strong> - Add your skills, experience, and preferences</li>
            <li><strong>Browse opportunities</strong> - Explore jobs tailored to your background</li>
            <li><strong>Set up job alerts</strong> - Get notified when perfect matches are posted</li>
            <li><strong>Apply with confidence</strong> - Use our AI-powered application tools</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:9002/profile" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Complete Your Profile
          </a>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="color: #374151; margin: 0 0 10px 0;">💡 Pro Tip</h4>
          <p style="margin: 0; color: #6b7280;">The more complete your profile, the better we can match you with relevant opportunities. Our AI analyzes your skills and experience to find the perfect fit!</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Ready to find your dream job?</p>
          <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">
            You're receiving this because you just joined CareerCompass. 
            <a href="#" style="color: #6b7280;">Manage preferences</a>
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // Create the campaign
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-campaign",
        name: `Welcome Campaign - ${firstName}`,
        subject: `🎉 Welcome to CareerCompass, ${firstName}! Your career journey begins now`,
        htmlContent: welcomeContent,
        listId: listId,
      }),
    });

    const createData = await response.json();

    if (createData.success && createData.campaignId) {
      // Automatically send the welcome campaign
      const sendResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-campaign",
          campaignId: createData.campaignId,
        }),
      });

      const sendData = await sendResponse.json();

      if (sendData.success) {
        return { success: true, campaignId: createData.campaignId };
      } else {
        return { success: false, error: "Failed to send welcome campaign" };
      }
    }

    return createData;
  } catch (error) {
    console.error("Error creating welcome campaign:", error);
    return { success: false, error: "Failed to create welcome campaign" };
  }
}

export async function scheduleWeeklyJobAlerts(): Promise<void> {
  // This function could be called by a cron job to send weekly job digest campaigns
  try {
    const jobDigestContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin-bottom: 10px;">📊 Your Weekly Job Digest</h2>
            <p style="color: #64748b; font-size: 16px;">Fresh opportunities handpicked for you</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">🔥 Hot Opportunities This Week</h3>
            <p style="margin-bottom: 15px;">We found several exciting positions that match your skills and experience. Here's what's trending in your field:</p>
            
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li><strong>Software Engineer</strong> positions at growing startups</li>
              <li><strong>Product Manager</strong> roles at tech companies</li>
              <li><strong>Data Scientist</strong> opportunities in fintech</li>
              <li><strong>DevOps Engineer</strong> roles with remote options</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">💡 Career Tip of the Week</h4>
            <p style="margin: 0; color: #374151;">Keep your skills up to date by following industry trends and taking online courses. Employers value candidates who show continuous learning!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="/opportunities" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-right: 10px;">
              View All Opportunities
            </a>
            <a href="/profile" style="background: #f3f4f6; color: #374151; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; border: 1px solid #d1d5db;">
              Update Profile
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <div style="text-align: center; color: #9ca3af; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">Stay ahead in your career journey!</p>
            <p style="margin: 0;"><strong>The CareerCompass Team</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              You're receiving this weekly digest because you're subscribed to job notifications. 
              <a href="#" style="color: #6b7280;">Update preferences</a> | 
              <a href="#" style="color: #6b7280;">Unsubscribe</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-campaign",
        name: `Weekly Job Digest - ${new Date().toLocaleDateString()}`,
        subject: "📊 Your Weekly Job Digest - New Opportunities Await!",
        htmlContent: jobDigestContent,
        listId: 5, // CareerCompass Job Seekers list
      }),
    });

    const createData = await response.json();

    if (createData.success) {
      // Send the campaign
      const sendResponse = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-campaign",
          campaignId: createData.campaignId,
        }),
      });

      const sendData = await sendResponse.json();
      console.log("Weekly job digest campaign result:", sendData);
    }
  } catch (error) {
    console.error("Error scheduling weekly job alerts:", error);
  }
}
