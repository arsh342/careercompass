import { NextRequest, NextResponse } from "next/server";
import { handleApplicationStatusChange } from "@/lib/automated-email-service";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { requireAuth, validateBody, validators, validationErrorResponse } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = withRateLimit(request, RATE_LIMITS.applicationStatus);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication required
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();

    // Validate required fields
    const validation = validateBody(body, [
      "applicationId",
      "status",
      "applicantEmail",
      "applicantName",
      "jobTitle",
      "companyName",
    ], {
      applicantEmail: validators.isEmail,
      status: validators.isOneOf(["approved", "rejected"]),
    });

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const {
      applicationId,
      jobId,
      userId,
      status,
      jobTitle,
      companyName,
      applicantName,
      applicantEmail,
    } = body;

    // Trigger automated email based on status
    await handleApplicationStatusChange({
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
        error: "Failed to process request",
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
