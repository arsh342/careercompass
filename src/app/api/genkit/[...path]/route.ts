
// Import all flows to register them with Genkit
import '@/ai/flows/generate-profile-summary';
import '@/ai/flows/analyze-opportunity-description';
import '@/ai/flows/find-matching-candidates';
import '@/ai/flows/find-and-rank-candidates';
import '@/ai/flows/send-application-status-email';

import { appRoute } from "@genkit-ai/next";

// This creates a catch-all route handler for Genkit
export const POST = appRoute;
