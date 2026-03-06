import { NextRequest, NextResponse } from "next/server";
import { isAiRateLimitError } from "@/lib/ai-rate-limit";
import { requireAuth } from "@/lib/api-auth";

interface ResumeMatchRequestBody {
  resumeDataUri?: string;
  jobTitle?: string;
  jobDescriptionText?: string;
  jobDescriptionDataUri?: string;
  jobDescriptionFileName?: string;
}

function splitSkills(skills: string): string[] {
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { response: authError, user } = await requireAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ResumeMatchRequestBody;
    if (!body.resumeDataUri) {
      return NextResponse.json({ error: "Resume upload is required." }, { status: 400 });
    }

    const { parseResume } = await import("@/ai/flows/parse-resume");
    const { scoreJobMatch } = await import("@/ai/flows/job-match");
    const { extractDocumentText } = await import("@/ai/flows/extract-document-text");
    const { suggestResumeMatchImprovements } = await import(
      "@/ai/flows/resume-match-suggestions"
    );

    const parsedResume = await parseResume({ resumeDataUri: body.resumeDataUri });

    const jobDescriptionText =
      body.jobDescriptionText?.trim() ||
      (
        await extractDocumentText({
          documentDataUri: body.jobDescriptionDataUri || "",
          documentKind: "job-description",
          fileName: body.jobDescriptionFileName,
        })
      ).text;

    if (!jobDescriptionText) {
      return NextResponse.json(
        { error: "Provide a job description by pasting text or uploading a file." },
        { status: 400 }
      );
    }

    const inferredJobTitle =
      body.jobTitle?.trim() || body.jobDescriptionFileName?.replace(/\.[^.]+$/, "") || "Target role";

    const match = await scoreJobMatch({
      userSkills: splitSkills(parsedResume.skills),
      userExperience: parsedResume.employmentHistory || undefined,
      userEducation: parsedResume.education || undefined,
      jobTitle: inferredJobTitle,
      jobDescription: jobDescriptionText,
    });

    const suggestions = await suggestResumeMatchImprovements({
      jobTitle: inferredJobTitle,
      jobDescription: jobDescriptionText,
      overallScore: match.overallScore,
      matchedSkills: match.breakdown.skills.matched,
      missingSkills: match.breakdown.skills.missing,
      parsedResume,
    });

    return NextResponse.json({
      jobTitle: inferredJobTitle,
      jobDescriptionText,
      parsedResume,
      match,
      suggestions,
    });
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
      error instanceof Error ? error.message : "Failed to analyze resume match. Please try again.";

    console.error("Resume match API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
