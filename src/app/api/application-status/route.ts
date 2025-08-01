import { NextRequest, NextResponse } from "next/server";
import { AutomatedEmailService } from "@/lib/automated-email-service";

export async function POST(request: NextRequest) {
  try {
    const {
      applicationId,
      jobId,
      userId,
      status,
      jobTitle,
      companyName,
      applicantName,
      applicantEmail,
    } = await request.json();

    // Validate required fields
    if (
      !applicationId ||
      !status ||
      !applicantEmail ||
      !applicantName ||
      !jobTitle ||
      !companyName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: applicationId, status, applicantEmail, applicantName, jobTitle, companyName",
        },
        { status: 400 }
      );
    }

    // Only handle approved and rejected statuses
    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        {
          success: false,
          error: 'Status must be either "approved" or "rejected"',
        },
        { status: 400 }
      );
    }

    // Trigger automated email based on status
    await AutomatedEmailService.handleApplicationStatusChange({
      applicationId,
      jobId,
      userId,
      status,
      jobTitle,
      companyName,
      applicantName,
      applicantEmail,
    });

    return NextResponse.json({
      success: true,
      message: `${
        status === "approved" ? "Approval" : "Rejection"
      } email sent to ${applicantEmail}`,
    });
  } catch (error) {
    console.error("Application status API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Application Status Automation API",
    usage: {
      "POST /api/application-status": {
        description: "Trigger automated emails for application status changes",
        body: {
          applicationId: "string",
          jobId: "string (optional)",
          userId: "string (optional)",
          status: '"approved" | "rejected"',
          jobTitle: "string",
          companyName: "string",
          applicantName: "string",
          applicantEmail: "string",
        },
      },
    },
  });
}
