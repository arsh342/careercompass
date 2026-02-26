/**
 * Notification types and helpers for the CareerCompass notification system.
 */

import {
  Briefcase,
  UserPlus,
  MessageSquare,
  Heart,
  Target,
  Bell,
  LucideIcon,
} from "lucide-react";

export type NotificationType =
  | 'application_update'    // Your application status changed
  | 'new_applicant'         // Someone applied to your posting (employer)
  | 'new_message'           // New chat message
  | 'new_follower'          // Someone followed you
  | 'job_match'             // AI found a matching job for you
  | 'system';               // System announcements

export interface AppNotification {
  id: string;
  userId: string;              // Recipient user ID
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  // Optional metadata for navigation
  link?: string;               // Where to navigate on click
  actorId?: string;            // Who triggered it (e.g., follower, employer)
  actorName?: string;
  actorPhotoURL?: string;
  metadata?: Record<string, string>; // Extra data (applicationId, opportunityId, etc.)
}

/**
 * Get the icon component for a notification type.
 */
export function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case 'application_update': return Briefcase;
    case 'new_applicant':      return UserPlus;
    case 'new_message':        return MessageSquare;
    case 'new_follower':       return Heart;
    case 'job_match':          return Target;
    case 'system':             return Bell;
  }
}

/**
 * Get a color class for a notification type.
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case 'application_update': return 'text-blue-500 bg-blue-500/10';
    case 'new_applicant':      return 'text-green-500 bg-green-500/10';
    case 'new_message':        return 'text-purple-500 bg-purple-500/10';
    case 'new_follower':       return 'text-pink-500 bg-pink-500/10';
    case 'job_match':          return 'text-amber-500 bg-amber-500/10';
    case 'system':             return 'text-muted-foreground bg-muted';
  }
}
