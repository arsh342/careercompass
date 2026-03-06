import { NextRequest, NextResponse } from "next/server";
import { handleApplicationStatusChange } from "@/lib/automated-email-service";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { requireRole, validateBody, validators, validationErrorResponse } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = withRateLimit(request, RATE_LIMITS.applicationStatus);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication required
    const { response: authError, user } = await requireRole(request, "employer");
    if (authError) return authError;
    if (!user || !adminDb) {
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const validation = validateBody(body, [
      "applicationId",
      "status",
    ], {
      status: validators.isOneOf(["approved", "rejected"]),
    });

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const {
      applicationId,
      status,
    } = body;

    const applicationDoc = await adminDb.collection("applications").doc(applicationId).get();
    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const application = applicationDoc.data() as Record<string, any>;
    const opportunityId = application.opportunityId;
    if (!opportunityId) {
      return NextResponse.json(
        { error: "Application is missing an opportunity reference" },
        { status: 400 }
      );
    }

    const opportunityDoc = await adminDb.collection("opportunities").doc(opportunityId).get();
    if (!opportunityDoc.exists) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const opportunity = opportunityDoc.data() as Record<string, any>;
    if (opportunity.employerId !== user.uid) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const applicantUserId = application.userId;
    const applicantDoc = applicantUserId
      ? await adminDb.collection("users").doc(applicantUserId).get()
      : null;
    const applicantProfile = applicantDoc?.exists ? (applicantDoc.data() as Record<string, any>) : null;

    const applicantEmail = application.userEmail || applicantProfile?.email;
    const applicantName = application.userName || applicantProfile?.displayName || "Applicant";
    const jobTitle = opportunity.title || "Opportunity";
    const companyName =
      opportunity.employerName ||
      opportunity.companyName ||
      user.email ||
      "CareerCompass";

    if (!applicantEmail || !validators.isEmail(applicantEmail)) {
      return NextResponse.json(
        { error: "Applicant email unavailable" },
        { status: 400 }
      );
    }

    // Trigger automated email based on status
    await handleApplicationStatusChange({
      applicationId,
      jobId: opportunityId,
      userId: applicantUserId,
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
          status: '"approved" | "rejected"',
        },
      },
    },
  });
}
