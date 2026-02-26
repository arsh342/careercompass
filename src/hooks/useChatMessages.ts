"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================
// TYPES
// ============================================

export interface Attachment {
  name: string;
  url: string;
  type: "image" | "file";
  size: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  attachments?: Attachment[];
  encrypted?: boolean;
  ciphertext?: string;
  iv?: string;
}

// ============================================
// HOOK: useChatMessages
// ============================================

/**
 * Subscribes to messages for the active chat in real-time.
 * Automatically marks unread messages from others as read.
 */
export function useChatMessages(
  activeChatId: string | null,
  currentUserId?: string
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Mark unread messages as read when chat is opened
  const markAsRead = useCallback(
    async (chatId: string) => {
      if (!currentUserId || !chatId) return;

      try {
        const unreadQuery = query(
          collection(db, "chats", chatId, "messages"),
          where("read", "==", false),
          where("senderId", "!=", currentUserId)
        );
        const snapshot = await getDocs(unreadQuery);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          batch.update(doc(db, "chats", chatId, "messages", d.id), {
            read: true,
          });
        });
        await batch.commit();
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [currentUserId]
  );

  // Subscribe to messages + mark as read on open
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    // Mark existing unread messages as read
    if (currentUserId) {
      markAsRead(activeChatId);
    }

    const messagesQuery = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageData: Message[] = [];
        snapshot.forEach((d) => {
          messageData.push({ id: d.id, ...d.data() } as Message);
        });
        setMessages(messageData);
        setMessagesLoading(false);

        // Also mark any new incoming messages as read
        if (currentUserId) {
          const hasUnread = snapshot
            .docChanges()
            .some(
              (change) =>
                change.type === "added" &&
                change.doc.data().senderId !== currentUserId &&
                !change.doc.data().read
            );
          if (hasUnread) {
            markAsRead(activeChatId);
          }
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setMessagesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeChatId, currentUserId, markAsRead]);

  return { messages, messagesLoading, markAsRead };
}

