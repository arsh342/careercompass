import { genkit } from "@/ai/genkit";
import { run } from "@genkit-ai/next";

export const POST = run({
  // This is required for Genkit to work with Next.js
  // and expose your flows as API endpoints.
  client: genkit,
});
