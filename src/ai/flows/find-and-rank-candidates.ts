'use server';

/**
 * @fileOverview Finds and ranks candidates based on an employer's active job postings.
 *
 * - findAndRankCandidates - A function that finds and ranks candidates for an employer.
 * - FindAndRankCandidatesInput - The input type for the findAndRankCandidates function.
 * - FindAndRankCandidatesOutput - The return type for the findAndRankCandidates function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const FindAndRankCandidatesInputSchema = z.object({
  employerId: z.string().describe("The ID of the employer whose active postings should be used for matching."),
});
export type FindAndRankCandidatesInput = z.infer<typeof FindAndRankCandidatesInputSchema>;

const RankedCandidateSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string(),
  photoURL: z.string().optional(),
  skills: z.string(),
  matchPercentage: z.number().describe("A score from 0-100 representing the candidate's suitability."),
  justification: z.string().describe("A brief explanation for why the candidate is a good match."),
});

const FindAndRankCandidatesOutputSchema = z.object({
  candidates: z.array(RankedCandidateSchema).describe('A ranked list of candidates who match the employer\'s needs.'),
});
export type FindAndRankCandidatesOutput = z.infer<typeof FindAndRankCandidatesOutputSchema>;

export async function findAndRankCandidates(
  input: FindAndRankCandidatesInput
): Promise<FindAndRankCandidatesOutput> {
  return findAndRankCandidatesFlow(input);
}

const rankCandidatesPrompt = ai.definePrompt({
    name: 'rankCandidatesPrompt',
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
    name: 'findAndRankCandidatesFlow',
    inputSchema: FindAndRankCandidatesInputSchema,
    outputSchema: FindAndRankCandidatesOutputSchema,
  },
  async ({ employerId }) => {
    
    // 1. Fetch employer's active postings to get required skills
    const postingsQuery = query(
        collection(db, "opportunities"),
        where("employerId", "==", employerId),
        where("status", "==", "Active")
    );
    const postingsSnapshot = await getDocs(postingsQuery);
    const requiredSkills = new Set<string>();
    postingsSnapshot.docs.forEach(doc => {
        const skillsArray = (doc.data().skills || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        skillsArray.forEach((skill: string) => requiredSkills.add(skill));
    });

    if (requiredSkills.size === 0) {
        return { candidates: [] };
    }
    const requiredSkillsString = Array.from(requiredSkills).join(', ');

    // 2. Fetch all employees
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
    const usersSnapshot = await getDocs(usersQuery);

    const allEmployees = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          skills: data.skills || '',
          experience: data.employmentHistory || '',
          careerGoals: data.careerGoals || '',
      }
    });

    // 3. Use AI to rank candidates
    const { output } = await rankCandidatesPrompt({
        requiredSkills: requiredSkillsString,
        candidates: allEmployees,
    });

    return output!;
  }
);
