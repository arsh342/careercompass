/**
 * Application Tracking - Type Definitions
 * For Kanban board and job application management
 */

export type ApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  userId: string;
  
  // Job details
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary?: string;
  jobUrl?: string;
  jobDescription?: string;
  
  // Status
  status: ApplicationStatus;
  statusHistory: StatusChange[];
  
  // Dates
  savedAt: Date;
  appliedAt?: Date;
  lastUpdated: Date;
  
  // Resume used
  resumeId?: string;
  resumeName?: string;
  coverLetterId?: string;
  
  // Notes
  notes: ApplicationNote[];
  
  // Interview details
  interviews: Interview[];
  
  // Offers
  offer?: OfferDetails;
  
  // Match score from AI
  matchScore?: number;
  
  // Source
  source?: 'linkedin' | 'indeed' | 'company' | 'referral' | 'other';
  referrer?: string;
  
  // Contact
  contacts: Contact[];
  
  // Tags
  tags: string[];
  
  // Priority
  priority: 'high' | 'medium' | 'low';
  
  // Follow-up
  nextFollowUp?: Date;
  followUpReminder?: boolean;
}

export interface StatusChange {
  id: string;
  from: ApplicationStatus;
  to: ApplicationStatus;
  date: Date;
  note?: string;
}

export interface ApplicationNote {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Interview {
  id: string;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | 'panel' | 'other';
  scheduledAt: Date;
  duration?: number; // minutes
  location?: string;
  meetingLink?: string;
  interviewers?: string[];
  notes?: string;
  outcome?: 'passed' | 'failed' | 'pending';
  feedback?: string;
}

export interface OfferDetails {
  salary: number;
  currency: string;
  bonus?: number;
  equity?: string;
  benefits?: string[];
  startDate?: Date;
  deadline?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  notes?: string;
}

// ============================================
// KANBAN CONFIGURATION
// ============================================

export interface KanbanColumn {
  id: ApplicationStatus;
  title: string;
  color: string;
  icon: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'saved', title: 'Saved', color: 'bg-slate-500', icon: 'Bookmark' },
  { id: 'applied', title: 'Applied', color: 'bg-blue-500', icon: 'Send' },
  { id: 'screening', title: 'Screening', color: 'bg-purple-500', icon: 'Search' },
  { id: 'interview', title: 'Interview', color: 'bg-amber-500', icon: 'Calendar' },
  { id: 'offer', title: 'Offer', color: 'bg-green-500', icon: 'Gift' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-500', icon: 'X' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createEmptyApplication(userId: string, jobData?: Partial<Application>): Application {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    userId,
    jobTitle: '',
    company: '',
    location: '',
    status: 'saved',
    statusHistory: [],
    savedAt: now,
    lastUpdated: now,
    notes: [],
    interviews: [],
    contacts: [],
    tags: [],
    priority: 'medium',
    ...jobData,
  };
}

export function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    saved: 'Saved',
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer Received',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return labels[status];
}

export function getStatusColor(status: ApplicationStatus): string {
  const colors: Record<ApplicationStatus, string> = {
    saved: 'bg-slate-500',
    applied: 'bg-blue-500',
    screening: 'bg-purple-500',
    interview: 'bg-amber-500',
    offer: 'bg-green-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-500',
  };
  return colors[status];
}

export function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
