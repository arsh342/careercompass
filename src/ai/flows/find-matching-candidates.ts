"use server";

/**
 * @fileOverview Finds candidates whose skills match a given opportunity.
 *
 * - findMatchingCandidates - A function that finds matching candidates for an opportunity.
 * - FindMatchingCandidatesInput - The input type for the findMatchingCandidates function.
 * - FindMatchingCandidatesOutput - The return type for the findMatchingCandidates function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const FindMatchingCandidatesInputSchema = z.object({
  opportunityId: z
    .string()
    .describe("The ID of the opportunity to match against."),
});
export type FindMatchingCandidatesInput = z.infer<
  typeof FindMatchingCandidatesInputSchema
>;

const CandidateSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string(),
  matchingSkills: z.array(z.string()),
  matchScore: z
    .number()
    .describe("Percentage of required skills matched (0-100)"),
});

const FindMatchingCandidatesOutputSchema = z.object({
  candidates: z
    .array(CandidateSchema)
    .describe(
      "A list of candidates who match the opportunity, ranked by match score."
    ),
});
export type FindMatchingCandidatesOutput = z.infer<
  typeof FindMatchingCandidatesOutputSchema
>;

export async function findMatchingCandidates(
  input: FindMatchingCandidatesInput
): Promise<FindMatchingCandidatesOutput> {
  return findMatchingCandidatesFlow(input);
}

const findMatchingCandidatesFlow = ai.defineFlow(
  {
    name: "findMatchingCandidatesFlow",
    inputSchema: FindMatchingCandidatesInputSchema,
    outputSchema: FindMatchingCandidatesOutputSchema,
  },
  async ({ opportunityId }) => {
    // 1. Fetch the opportunity details
    const oppDocRef = doc(db, "opportunities", opportunityId);
    const oppDocSnap = await getDoc(oppDocRef);

    if (!oppDocSnap.exists()) {
      throw new Error(`Opportunity with ID ${opportunityId} not found.`);
    }

    const opportunity = oppDocSnap.data();
    const requiredSkills = new Set(
      (opportunity.skills || "")
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean)
    );

    if (requiredSkills.size === 0) {
      return { candidates: [] };
    }

    // 2. Fetch all employees
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "employee")
    );
    const usersSnapshot = await getDocs(usersQuery);

    const matchingCandidates: z.infer<typeof CandidateSchema>[] = [];

    // 3. Find matches and calculate match score
    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      const userSkills = new Set(
        (user.skills || "")
          .split(",")
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean)
      );

      const commonSkills = [...userSkills].filter((skill) =>
        requiredSkills.has(skill)
      ) as string[];
      const matchScore =
        requiredSkills.size > 0
          ? Math.round((commonSkills.length / requiredSkills.size) * 100)
          : 0;

      if (commonSkills.length > 0) {
        matchingCandidates.push({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          matchingSkills: commonSkills,
          matchScore,
        });
      }
    }

    // Sort candidates by matchScore descending
    matchingCandidates.sort((a, b) => b.matchScore - a.matchScore);

    return { candidates: matchingCandidates };
  }
);
