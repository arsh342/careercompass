'use server';

/**
 * @fileOverview Generates a professional resume section using AI.
 *
 * - generateResumeSection - A function that generates a resume section.
 * - GenerateResumeSectionInput - The input type.
 * - GenerateResumeSectionOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateResumeSectionInputSchema = z.object({
  sectionType: z.enum([
    'summary',
    'experience',
    'skills',
    'education',
    'projects',
    'achievements',
  ]).describe('The type of resume section to generate.'),
  userInfo: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    experience: z.string().optional(),
    skills: z.string().optional(),
    education: z.string().optional(),
    achievements: z.string().optional(),
    targetRole: z.string().optional(),
    targetCompany: z.string().optional(),
  }).describe('User information to personalize the resume.'),
  jobDescription: z.string().optional().describe('Target job description to tailor the resume.'),
  tone: z.enum(['professional', 'creative', 'executive', 'technical']).default('professional'),
});

export type GenerateResumeSectionInput = z.infer<typeof GenerateResumeSectionInputSchema>;

const GenerateResumeSectionOutputSchema = z.object({
  content: z.string().describe('The generated resume section content.'),
  keywords: z.array(z.string()).describe('Key skills and keywords included.'),
  suggestions: z.array(z.string()).describe('Suggestions to improve this section.'),
});

export type GenerateResumeSectionOutput = z.infer<typeof GenerateResumeSectionOutputSchema>;

export async function generateResumeSection(
  input: GenerateResumeSectionInput
): Promise<GenerateResumeSectionOutput> {
  return generateResumeSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResumeSectionPrompt',
  input: { schema: GenerateResumeSectionInputSchema },
  output: { schema: GenerateResumeSectionOutputSchema },
  system: `You are an expert resume writer and career coach with 15+ years of experience helping candidates land jobs at top companies. You specialize in creating ATS-optimized, impactful resume content.

Key principles:
- Use strong action verbs (Led, Developed, Achieved, Implemented)
- Quantify achievements with metrics when possible
- Include relevant keywords for ATS optimization
- Keep content concise and impactful
- Tailor content to the target role if provided`,
  prompt: `Generate a {{sectionType}} section for a resume with the following context:

{{#if userInfo.name}}Name: {{userInfo.name}}{{/if}}
{{#if userInfo.title}}Current/Target Title: {{userInfo.title}}{{/if}}
{{#if userInfo.experience}}Experience: {{userInfo.experience}}{{/if}}
{{#if userInfo.skills}}Skills: {{userInfo.skills}}{{/if}}
{{#if userInfo.education}}Education: {{userInfo.education}}{{/if}}
{{#if userInfo.achievements}}Key Achievements: {{userInfo.achievements}}{{/if}}
{{#if userInfo.targetRole}}Target Role: {{userInfo.targetRole}}{{/if}}
{{#if userInfo.targetCompany}}Target Company: {{userInfo.targetCompany}}{{/if}}
{{#if jobDescription}}Job Description to Target: {{jobDescription}}{{/if}}

Tone: {{tone}}

Generate a compelling, ATS-optimized {{sectionType}} section.`,
});

const generateResumeSectionFlow = ai.defineFlow(
  {
    name: 'generateResumeSectionFlow',
    inputSchema: GenerateResumeSectionInputSchema,
    outputSchema: GenerateResumeSectionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Full resume generation
const GenerateFullResumeInputSchema = z.object({
  userInfo: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    title: z.string(),
    experience: z.string(),
    skills: z.string(),
    education: z.string(),
    achievements: z.string().optional(),
    projects: z.string().optional(),
  }),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  jobDescription: z.string().optional(),
  format: z.enum(['modern', 'classic', 'creative', 'executive']).default('modern'),
});

export type GenerateFullResumeInput = z.infer<typeof GenerateFullResumeInputSchema>;

const GenerateFullResumeOutputSchema = z.object({
  summary: z.string().describe('Professional summary section.'),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    duration: z.string(),
    bullets: z.array(z.string()),
  })).describe('Work experience entries.'),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
  }).describe('Skills categorized.'),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string(),
  })).describe('Education entries.'),
  atsScore: z.number().describe('Estimated ATS compatibility score (0-100).'),
  improvements: z.array(z.string()).describe('Suggested improvements.'),
});

export type GenerateFullResumeOutput = z.infer<typeof GenerateFullResumeOutputSchema>;

export async function generateFullResume(
  input: GenerateFullResumeInput
): Promise<GenerateFullResumeOutput> {
  return generateFullResumeFlow(input);
}

const fullResumePrompt = ai.definePrompt({
  name: 'generateFullResumePrompt',
  input: { schema: GenerateFullResumeInputSchema },
  output: { schema: GenerateFullResumeOutputSchema },
  system: `You are a world-class resume writer who has helped thousands of candidates land jobs at Fortune 500 companies and startups. You create ATS-optimized, impactful resumes that get results.

Your resumes are known for:
- Clear, quantified achievements
- Strategic keyword placement for ATS systems
- Compelling professional narratives
- Perfect formatting and structure`,
  prompt: `Create a complete, professional resume for:

Name: {{userInfo.name}}
Email: {{userInfo.email}}
{{#if userInfo.phone}}Phone: {{userInfo.phone}}{{/if}}
{{#if userInfo.location}}Location: {{userInfo.location}}{{/if}}
{{#if userInfo.linkedin}}LinkedIn: {{userInfo.linkedin}}{{/if}}

Current/Target Title: {{userInfo.title}}

Experience:
{{userInfo.experience}}

Skills:
{{userInfo.skills}}

Education:
{{userInfo.education}}

{{#if userInfo.achievements}}Achievements: {{userInfo.achievements}}{{/if}}
{{#if userInfo.projects}}Projects: {{userInfo.projects}}{{/if}}

{{#if targetRole}}Target Role: {{targetRole}}{{/if}}
{{#if targetCompany}}Target Company: {{targetCompany}}{{/if}}
{{#if jobDescription}}Tailored for this Job Description: {{jobDescription}}{{/if}}

Format Style: {{format}}

Generate a complete, ATS-optimized resume with all sections.`,
});

// Helper function to retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on 503 (overloaded) or 429 (rate limit) errors
      const status = error?.status || error?.statusCode;
      if (status !== 503 && status !== 429 && attempt > 0) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`AI API overloaded, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

const generateFullResumeFlow = ai.defineFlow(
  {
    name: 'generateFullResumeFlow',
    inputSchema: GenerateFullResumeInputSchema,
    outputSchema: GenerateFullResumeOutputSchema,
  },
  async (input) => {
    const { output } = await withRetry(() => fullResumePrompt(input));
    return output!;
  }
);

