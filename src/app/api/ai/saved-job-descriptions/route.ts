import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/api-auth";
import { isAiRateLimitError } from "@/lib/ai-rate-limit";

function normalizeTimestamp(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return undefined;
  }

  try {
    return (value as { toDate: () => Date }).toDate().toISOString();
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const { response: authError, user } = await requireAuth(request);
  if (authError) return authError;
  if (!user || !adminDb) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await adminDb
    .collection("users")
    .doc(user.uid)
    .collection("savedJobDescriptions")
    .orderBy("updatedAt", "desc")
    .get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "Saved job description",
      text: data.text || "",
      fileName: data.fileName,
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt),
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user || !adminDb) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      title?: string;
      text?: string;
      fileName?: string;
      documentDataUri?: string;
    };

    let text = body.text?.trim() || "";
    let title = body.title?.trim() || "";

    if (!text && body.documentDataUri) {
      const { extractDocumentText } = await import("@/ai/flows/extract-document-text");
      const extracted = await extractDocumentText({
        documentDataUri: body.documentDataUri,
        documentKind: "job-description",
        fileName: body.fileName,
      });
      text = extracted.text.trim();
      if (!title) {
        title = extracted.title.trim();
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: "Job description text is required to save." },
        { status: 400 }
      );
    }

    if (!title) {
      title = body.fileName?.replace(/\.[^.]+$/, "") || "Saved job description";
    }

    const collectionRef = adminDb.collection("users").doc(user.uid).collection("savedJobDescriptions");
    const docRef = body.id ? collectionRef.doc(body.id) : collectionRef.doc();
    const existingSnapshot = body.id ? await docRef.get() : null;
    const existingCreatedAt = existingSnapshot?.exists ? existingSnapshot.get("createdAt") : null;

    await docRef.set(
      {
        title,
        text,
        fileName: body.fileName || null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: existingCreatedAt || FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ id: docRef.id, title, text, fileName: body.fileName || null });
  } catch (error) {
    if (isAiRateLimitError(error)) {
      return NextResponse.json(
        {
          error: "Too many AI requests. Please try again later.",
          retryAfter: error.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to save the job description.";

    console.error("Saved job description API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { response: authError, user } = await requireAuth(request);
  if (authError) return authError;
  if (!user || !adminDb) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Saved job description id is required." }, { status: 400 });
  }

  await adminDb
    .collection("users")
    .doc(user.uid)
    .collection("savedJobDescriptions")
    .doc(body.id)
    .delete();

  return NextResponse.json({ ok: true });
}
