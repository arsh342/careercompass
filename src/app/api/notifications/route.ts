import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth, validateBody, validators, validationErrorResponse } from "@/lib/api-auth";

type NotificationType = "application_update" | "new_follower";

interface NotificationRequestBody {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId?: string;
  metadata?: Record<string, string>;
}

function sanitizeMetadata(metadata: unknown): Record<string, string> | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const entries = Object.entries(metadata).filter(
    ([key, value]) =>
      typeof key === "string" &&
      key.length <= 100 &&
      typeof value === "string" &&
      value.length <= 500
  );

  return Object.fromEntries(entries);
}

export async function POST(request: NextRequest) {
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user || !adminDb) {
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as NotificationRequestBody;
    const validation = validateBody(body, ["userId", "type", "title", "message"], {
      userId: validators.isNonEmptyString,
      type: validators.isOneOf(["application_update", "new_follower"] as NotificationType[]),
      title: validators.maxLength(200),
      message: validators.maxLength(500),
    });

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    if (body.actorId && body.actorId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorDoc = await adminDb.collection("users").doc(user.uid).get();
    const actorProfile = actorDoc.exists ? (actorDoc.data() as Record<string, any>) : {};
    const metadata = sanitizeMetadata(body.metadata);

    switch (body.type) {
      case "new_follower": {
        const following = Array.isArray(actorProfile.following) ? actorProfile.following : [];
        if (!following.includes(body.userId)) {
          return NextResponse.json(
            { error: "Follow relationship not found" },
            { status: 403 }
          );
        }
        break;
      }

      case "application_update": {
        const applicationId = metadata?.applicationId;
        if (!applicationId) {
          return NextResponse.json(
            { error: "applicationId metadata is required" },
            { status: 400 }
          );
        }

        const applicationDoc = await adminDb.collection("applications").doc(applicationId).get();
        if (!applicationDoc.exists) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const application = applicationDoc.data() as Record<string, any>;
        if (application.userId !== body.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const opportunityId =
          typeof application.opportunityId === "string"
            ? application.opportunityId
            : metadata?.opportunityId;

        if (!opportunityId) {
          return NextResponse.json(
            { error: "Opportunity reference missing" },
            { status: 400 }
          );
        }

        const opportunityDoc = await adminDb.collection("opportunities").doc(opportunityId).get();
        if (!opportunityDoc.exists) {
          return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
        }

        const opportunity = opportunityDoc.data() as Record<string, any>;
        if (opportunity.employerId !== user.uid) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        break;
      }
    }

    const actorName =
      (typeof actorProfile.displayName === "string" && actorProfile.displayName) ||
      user.email ||
      null;
    const actorPhotoURL =
      typeof actorProfile.photoURL === "string" ? actorProfile.photoURL : null;

    const notificationRef = await adminDb.collection("notifications").add({
      userId: body.userId,
      type: body.type,
      title: body.title.trim(),
      message: body.message.trim(),
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      link: typeof body.link === "string" ? body.link : null,
      actorId: user.uid,
      actorName,
      actorPhotoURL,
      metadata,
    });

    return NextResponse.json({ success: true, notificationId: notificationRef.id });
  } catch (error) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
