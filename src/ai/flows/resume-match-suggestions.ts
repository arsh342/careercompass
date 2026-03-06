'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireServerAuthenticatedUser } from '@/lib/server-auth';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';

const SectionSuggestionSchema = z.object({
  section: z.enum(['summary', 'skills', 'experience', 'education', 'general']),
  priority: z.enum(['high', 'medium', 'low']),
  currentFocus: z.string().describe('The part of the resume this suggestion applies to.'),
  suggestion: z
    .string()
    .describe('A concise rewritten suggestion or insertion that improves alignment.'),
  rationale: z.string().describe('Why this change improves the match.'),
});

const ResumeMatchSuggestionsInputSchema = z.object({
  jobTitle: z.string().optional(),
  jobDescription: z.string(),
  overallScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  parsedResume: z.object({
    education: z.string(),
    skills: z.string(),
    interests: z.string(),
    careerGoals: z.string(),
    employmentHistory: z.string(),
  }),
});

export type ResumeMatchSuggestionsInput = z.infer<typeof ResumeMatchSuggestionsInputSchema>;

const ResumeMatchSuggestionsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the resume-to-job alignment.'),
  keywordTargets: z.array(z.string()).describe('Top keywords the resume should reflect.'),
  quickWins: z.array(z.string()).describe('Immediate high-impact changes the candidate can make.'),
  sectionSuggestions: z.array(SectionSuggestionSchema).max(8),
});

export type ResumeMatchSuggestionsOutput = z.infer<typeof ResumeMatchSuggestionsOutputSchema>;

export async function suggestResumeMatchImprovements(
  input: ResumeMatchSuggestionsInput
): Promise<ResumeMatchSuggestionsOutput> {
  const user = await requireServerAuthenticatedUser();
  await enforceAiRateLimit({
    userId: user.uid,
    plan: user.profile?.plan as string | undefined,
    tool: 'jobMatch',
  });
  return resumeMatchSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeMatchSuggestionsPrompt',
  input: { schema: ResumeMatchSuggestionsInputSchema },
  output: { schema: ResumeMatchSuggestionsOutputSchema },
  system: `You are an ATS optimization expert. Improve resume alignment without changing the resume's visual design.

Rules:
- Focus on text-level changes only.
- Keep suggestions practical and realistic.
- Prioritize keyword alignment, measurable impact, and role relevance.
- Do not invent credentials or experience.
- Suggestions must fit into existing resume sections.`,
  prompt: `Analyze this resume against the job target and produce targeted text changes.

Target role: {{jobTitle}}
Current match score: {{overallScore}}
Matched skills: {{matchedSkills}}
Missing skills: {{missingSkills}}

Resume:
- Career goals: {{parsedResume.careerGoals}}
- Skills: {{parsedResume.skills}}
- Employment history: {{parsedResume.employmentHistory}}
- Education: {{parsedResume.education}}
- Interests: {{parsedResume.interests}}

Job description:
{{jobDescription}}`,
});

const resumeMatchSuggestionsFlow = ai.defineFlow(
  {
    name: 'resumeMatchSuggestionsFlow',
    inputSchema: ResumeMatchSuggestionsInputSchema,
    outputSchema: ResumeMatchSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
