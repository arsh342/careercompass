/**
 * Gamification & Achievements - Type Definitions
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'profile' | 'applications' | 'interviews' | 'engagement' | 'milestone';
  requirement: {
    type: 'count' | 'streak' | 'milestone';
    target: number;
    metric: string;
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number; // 0-100
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakProtected: boolean; // One skip allowed
}

export interface UserStats {
  totalApplications: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  totalInterviews: number;
  interviewsScheduled: number;
  offersReceived: number;
  responseRate: number;
  averageTimeToResponse: number; // days
  savedJobs: number;
  aiToolsUsed: number;
  resumesCreated: number;
  coverLettersGenerated: number;
}

// ============================================
// ACHIEVEMENTS CATALOG
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // Profile Achievements
  {
    id: 'profile-complete',
    name: 'Complete Profile',
    description: 'Fill out all profile fields',
    icon: 'User',
    category: 'profile',
    requirement: { type: 'milestone', target: 100, metric: 'profileCompleteness' },
    points: 50,
    rarity: 'common',
  },
  {
    id: 'first-resume',
    name: 'Resume Ready',
    description: 'Create your first resume',
    icon: 'FileText',
    category: 'profile',
    requirement: { type: 'count', target: 1, metric: 'resumesCreated' },
    points: 30,
    rarity: 'common',
  },
  
  // Application Achievements
  {
    id: 'first-application',
    name: 'First Step',
    description: 'Submit your first job application',
    icon: 'Send',
    category: 'applications',
    requirement: { type: 'count', target: 1, metric: 'totalApplications' },
    points: 20,
    rarity: 'common',
  },
  {
    id: 'ten-applications',
    name: 'Getting Serious',
    description: 'Apply to 10 jobs',
    icon: 'Target',
    category: 'applications',
    requirement: { type: 'count', target: 10, metric: 'totalApplications' },
    points: 50,
    rarity: 'common',
  },
  {
    id: 'fifty-applications',
    name: 'Persistent',
    description: 'Apply to 50 jobs',
    icon: 'Flame',
    category: 'applications',
    requirement: { type: 'count', target: 50, metric: 'totalApplications' },
    points: 100,
    rarity: 'rare',
  },
  {
    id: 'hundred-applications',
    name: 'Unstoppable',
    description: 'Apply to 100 jobs',
    icon: 'Rocket',
    category: 'applications',
    requirement: { type: 'count', target: 100, metric: 'totalApplications' },
    points: 200,
    rarity: 'epic',
  },
  
  // Interview Achievements
  {
    id: 'first-interview',
    name: 'Interview Time',
    description: 'Get your first interview',
    icon: 'Calendar',
    category: 'interviews',
    requirement: { type: 'count', target: 1, metric: 'totalInterviews' },
    points: 75,
    rarity: 'rare',
  },
  {
    id: 'five-interviews',
    name: 'Interview Pro',
    description: 'Complete 5 interviews',
    icon: 'MessageSquare',
    category: 'interviews',
    requirement: { type: 'count', target: 5, metric: 'totalInterviews' },
    points: 150,
    rarity: 'epic',
  },
  
  // Engagement Achievements
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day activity streak',
    icon: 'Flame',
    category: 'engagement',
    requirement: { type: 'streak', target: 7, metric: 'currentStreak' },
    points: 50,
    rarity: 'common',
  },
  {
    id: 'month-streak',
    name: 'Monthly Master',
    description: 'Maintain a 30-day activity streak',
    icon: 'Trophy',
    category: 'engagement',
    requirement: { type: 'streak', target: 30, metric: 'currentStreak' },
    points: 200,
    rarity: 'epic',
  },
  
  // Milestone Achievements
  {
    id: 'first-offer',
    name: 'Dream Achieved',
    description: 'Receive your first job offer',
    icon: 'Gift',
    category: 'milestone',
    requirement: { type: 'count', target: 1, metric: 'offersReceived' },
    points: 500,
    rarity: 'legendary',
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  const colors = {
    common: 'text-slate-500 bg-slate-500/10',
    rare: 'text-blue-500 bg-blue-500/10',
    epic: 'text-purple-500 bg-purple-500/10',
    legendary: 'text-amber-500 bg-amber-500/10',
  };
  return colors[rarity];
}
