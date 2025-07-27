import { config } from 'dotenv';
config();

import '@/ai/flows/generate-profile-summary.ts';
import '@/ai/flows/analyze-opportunity-description.ts';
import '@/ai/flows/find-matching-candidates.ts';
import '@/ai/flows/find-and-rank-candidates.ts';
import '@/ai/flows/send-application-status-email.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/enhance-text.ts';
