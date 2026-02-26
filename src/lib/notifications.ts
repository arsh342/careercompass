/**
 * Helper to create notifications in Firestore.
 * Called from various places (follow handler, application status, etc.)
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    await addDoc(collection(db, 'notifications'), {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      createdAt: serverTimestamp(),
      link: params.link || null,
      actorId: params.actorId || null,
      actorName: params.actorName || null,
      actorPhotoURL: params.actorPhotoURL || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
