"use server";

/**
 * @fileOverview Finds and ranks candidates based on an employer's active job postings.
 *
 * - findAndRankCandidates - A function that finds and ranks candidates for an employer.
 * - FindAndRankCandidatesInput - The input type for the findAndRankCandidates function.
 * - FindAndRankCandidatesOutput - The return type for the findAndRankCandidates function.
 */

import { ai } from "@/ai/genkit";
import { sendApplicationStatusEmail } from "./send-application-status-email";
import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const FindAndRankCandidatesInputSchema = z.object({
  employerId: z
    .string()
    .describe(
      "The ID of the employer whose active postings should be used for matching."
    ),
});
export type FindAndRankCandidatesInput = z.infer<
  typeof FindAndRankCandidatesInputSchema
>;

const RankedCandidateSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string(),
  photoURL: z.string().optional(),
  skills: z.string(),
  matchPercentage: z
    .number()
    .describe("A score from 0-100 representing the candidate's suitability."),
  justification: z
    .string()
    .describe("A brief explanation for why the candidate is a good match."),
  applicationStatus: z
    .enum(["applied", "invited", "not_applied"])
    .describe("Whether the candidate has applied, been invited, or neither."),
});

const FindAndRankCandidatesOutputSchema = z.object({
  candidates: z
    .array(RankedCandidateSchema)
    .describe("A ranked list of candidates who match the employer's needs."),
});
export type FindAndRankCandidatesOutput = z.infer<
  typeof FindAndRankCandidatesOutputSchema
>;

export async function findAndRankCandidates(
  input: FindAndRankCandidatesInput
): Promise<FindAndRankCandidatesOutput> {
  return findAndRankCandidatesFlow(input);
}

const rankCandidatesPrompt = ai.definePrompt({
  name: "rankCandidatesPrompt",
  input: { schema: z.any() },
  output: { schema: FindAndRankCandidatesOutputSchema },
  prompt: `You are an expert HR recruiter. Your task is to analyze a list of potential candidates and rank them based on their suitability for an employer's needs.

    The employer requires the following skills:
    {{requiredSkills}}

    Here is the list of candidates:
    {{#each candidates}}
    - Candidate UID: {{uid}}
      - Name: {{displayName}}
      - Email: {{email}}
      - Photo URL: {{photoURL}}
      - Skills: {{skills}}
      - Experience: {{experience}}
      - Career Goals: {{careerGoals}}
    {{/each}}

    Please evaluate each candidate and provide a ranked list. For each candidate, include:
    - uid, displayName, email, photoURL, skills
    - matchPercentage: A score from 0 to 100. Calculate this based on the alignment of the candidate's skills, experience, and career goals with the required skills. Direct skill matches are important, but also consider related experience.
    - justification: A brief, one-sentence explanation for your ranking.

    Only include candidates who have at least one matching skill. Return the list sorted from the highest matchPercentage to the lowest.
    `,
});

const findAndRankCandidatesFlow = ai.defineFlow(
  {
    name: "findAndRankCandidatesFlow",
    inputSchema: FindAndRankCandidatesInputSchema,
    outputSchema: FindAndRankCandidatesOutputSchema,
  },
  async ({ employerId }) => {
    // 1. Fetch employer's active postings to get required skills and opportunity IDs
    const postingsQuery = query(
      collection(db, "opportunities"),
      where("employerId", "==", employerId)
    );
    const postingsSnapshot = await getDocs(postingsQuery);

    if (postingsSnapshot.empty) {
      return { candidates: [] };
    }

    const requiredSkills = new Set<string>();
    const opportunityIds = postingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const skillsArray = (data.skills || "")
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      skillsArray.forEach((skill: string) => requiredSkills.add(skill));
      return doc.id;
    });

    if (requiredSkills.size === 0) {
      return { candidates: [] };
    }
    const requiredSkillsString = Array.from(requiredSkills).join(", ");

    // 2. Fetch applications for these opportunities to find users who have applied or been invited
    const appliedUserIds = new Set<string>();
    const invitedUserIds = new Set<string>();
    if (opportunityIds.length > 0) {
      const applicationsQuery = query(
        collection(db, "applications"),
        where("opportunityId", "in", opportunityIds)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      applicationsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          ["Approved", "Rejected", "Pending", "Applied"].includes(data.status)
        ) {
          appliedUserIds.add(data.userId);
        } else if (data.status === "Invited") {
          invitedUserIds.add(data.userId);
        }
      });
    }

    // 3. Fetch all employees
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "employee")
    );
    const usersSnapshot = await getDocs(usersQuery);

    const allEmployees = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        skills: data.skills || "",
        experience: data.employmentHistory || "",
        careerGoals: data.careerGoals || "",
      };
    });

    // 4. Define eligible and applied employees

    const eligibleEmployees = allEmployees.filter(
      (emp) => !appliedUserIds.has(emp.uid) && !invitedUserIds.has(emp.uid)
    );
    const appliedEmployees = allEmployees.filter((emp) =>
      appliedUserIds.has(emp.uid)
    );
    const invitedEmployees = allEmployees.filter((emp) =>
      invitedUserIds.has(emp.uid)
    );
    const combinedEmployees = [
      ...appliedEmployees,
      ...invitedEmployees,
      ...eligibleEmployees,
    ];

    // Remove duplicates by UID (in case of overlap)
    const uniqueEmployeesMap = new Map();
    combinedEmployees.forEach((emp) => {
      uniqueEmployeesMap.set(emp.uid, emp);
    });

    const uniqueEmployees = Array.from(uniqueEmployeesMap.values());

    // Debug output: log all employees being considered and required skills
    if (uniqueEmployees.length === 0) {
      return { candidates: [] };
    }

    // 5. Use AI to rank candidates
    let output;
    try {
      const result = await rankCandidatesPrompt({
        requiredSkills: requiredSkillsString,
        candidates: uniqueEmployees,
      });
      output = result.output;
    } catch (err) {
      console.error(
        "[findAndRankCandidates] Error in rankCandidatesPrompt:",
        err
      );
    }

    // Fallback: If AI output is missing or empty, return top 5 employees with default values
    let candidatesWithStatus;
    if (!output || !output.candidates || output.candidates.length === 0) {
      candidatesWithStatus = uniqueEmployees.slice(0, 5).map((emp) => {
        let applicationStatus: "applied" | "invited" | "not_applied";
        if (appliedUserIds.has(emp.uid)) {
          applicationStatus = "applied";
        } else if (invitedUserIds.has(emp.uid)) {
          applicationStatus = "invited";
        } else {
          applicationStatus = "not_applied";
        }
        return {
          uid: emp.uid,
          displayName: emp.displayName,
          email: emp.email,
          photoURL: emp.photoURL,
          skills: emp.skills,
          matchPercentage: 50,
          justification:
            "Candidate is eligible or applied but not ranked by AI.",
          applicationStatus,
        };
      });
      return { candidates: candidatesWithStatus };
    }

    // Add applicationStatus to each candidate in the ranked list
    candidatesWithStatus = output.candidates.map((candidate) => {
      let applicationStatus: "applied" | "invited" | "not_applied";
      if (appliedUserIds.has(candidate.uid)) {
        applicationStatus = "applied";
      } else if (invitedUserIds.has(candidate.uid)) {
        applicationStatus = "invited";
      } else {
        applicationStatus = "not_applied";
      }
      return {
        ...candidate,
        applicationStatus,
      };
    });

    // Send a real email to each candidate in the ranked list (optional, keep if needed)
    // for (const candidate of candidatesWithStatus) {
    //   try {
    //     await sendApplicationStatusEmail({
    //       to: candidate.email,
    //       subject: `You've been ranked for new opportunities!`,
    //       body: `
    //         <p>Hi ${candidate.displayName},</p>
    //         <p>You have been ranked as a potential match for new opportunities at your employer's company.</p>
    //         <p>Your match score: <strong>${candidate.matchPercentage}%</strong></p>
    //         <p>Reason: ${candidate.justification}</p>
    //         <p>Log in to your CareerCompass account to view more details and apply.</p>
    //         <p>Best regards,<br/>CareerCompass Team</p>
    //       `
    //     });
    //   } catch (e) {
    //     console.error(`[findAndRankCandidates] Failed to send email to ${candidate.email}:`, e);
    //   }
    // }

    return { candidates: candidatesWithStatus };
  }
);
