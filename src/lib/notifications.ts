/**
 * Helper to create notifications through the authenticated API route.
 */

import { authenticatedFetch } from '@/lib/session';
import type { NotificationType } from '@/types/notification-types';

interface CreateNotificationParams {
  userId: string;          // Recipient
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId?: string;
  actorName?: string;
  actorPhotoURL?: string;
  metadata?: Record<string, string>;
}

/**
 * Create a notification for a user. Fire-and-forget — errors are logged but don't block the caller.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const response = await authenticatedFetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        actorPhotoURL: params.actorPhotoURL || null,
        metadata: params.metadata || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notification request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
