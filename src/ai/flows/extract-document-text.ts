'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { requireServerAuthenticatedUser } from '@/lib/server-auth';
import { enforceAiRateLimit } from '@/lib/ai-rate-limit';

const ExtractDocumentTextInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document file as a data URI with MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentKind: z.enum(['resume', 'job-description']).default('job-description'),
  fileName: z.string().optional(),
});

export type ExtractDocumentTextInput = z.infer<typeof ExtractDocumentTextInputSchema>;

const ExtractDocumentTextOutputSchema = z.object({
  title: z.string().describe('A concise inferred title for the document.'),
  text: z.string().describe('Plain extracted text from the document without commentary.'),
});

export type ExtractDocumentTextOutput = z.infer<typeof ExtractDocumentTextOutputSchema>;

export async function extractDocumentText(
  input: ExtractDocumentTextInput
): Promise<ExtractDocumentTextOutput> {
  const user = await requireServerAuthenticatedUser();
  await enforceAiRateLimit({
    userId: user.uid,
    plan: user.profile?.plan as string | undefined,
    tool: 'opportunityAnalysis',
  });
  return extractDocumentTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDocumentTextPrompt',
  input: { schema: ExtractDocumentTextInputSchema },
  output: { schema: ExtractDocumentTextOutputSchema },
  system: `You extract text from uploaded career documents with high fidelity.

Rules:
- Return plain text only, with line breaks where helpful.
- Preserve important wording, metrics, skills, and section labels.
- Do not summarize.
- Infer a short useful title from the document contents or filename.
- If the file is a job description, prefer the role title for the title.
- If the file is a resume, prefer the candidate's role or the filename.
- If text is partially unreadable, extract the readable parts accurately.`,
  prompt: `Extract the text from this {{documentKind}} document.

{{#if fileName}}Original filename: {{fileName}}{{/if}}

Document:
{{media url=documentDataUri}}`,
});

const extractDocumentTextFlow = ai.defineFlow(
  {
    name: 'extractDocumentTextFlow',
    inputSchema: ExtractDocumentTextInputSchema,
    outputSchema: ExtractDocumentTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
