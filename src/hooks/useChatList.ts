"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================
// TYPES
// ============================================

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
      role: "employer" | "employee";
    };
  };
  displayName: string;
  photoURL?: string;
  type?: string;
  opportunityId: string;
  opportunityTitle: string;
  applicationId: string;
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
}

// ============================================
// HOOK: useChatList
// ============================================

/**
 * Subscribes to the authenticated user's chat list in real-time
 * and tracks unread message counts across all chats.
 */
export function useChatList(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen to user's chats
  useEffect(() => {
    if (!userId) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessage.timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatData: Chat[] = [];
        snapshot.forEach((doc) => {
          chatData.push({ id: doc.id, ...doc.data() } as Chat);
        });
        setChats(chatData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Calculate unread count
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const chatUnreads = new Map<string, number>();

    chats.forEach((chat) => {
      const messagesQuery = query(
        collection(db, "chats", chat.id, "messages"),
        where("read", "==", false),
        where("senderId", "!=", userId),
        limit(10)
      );

      const unsub = onSnapshot(messagesQuery, (snapshot) => {
        chatUnreads.set(chat.id, snapshot.size);
        // Recalculate total from all chats
        let total = 0;
        chatUnreads.forEach((count) => {
          total += count;
        });
        setUnreadCount(total);
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [chats, userId]);

  return { chats, loading, unreadCount };
}
