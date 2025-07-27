
import { ai } from "@/ai/genkit";
import { createHandler } from "@genkit-ai/next";

export const POST = createHandler({
  // This is required for Genkit to work with Next.js
  // and expose your flows as API endpoints.
  client: ai,
});
