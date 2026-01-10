"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  limit,
  getDoc,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

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
}

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

interface ChatContextType {
  chats: Chat[];
  loading: boolean;
  unreadCount: number;
  activeChat: Chat | null;
  messages: Message[];
  messagesLoading: boolean;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, text: string, attachments?: File[]) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createOrGetChat: (
    otherUserId: string,
    opportunityId: string,
    opportunityTitle: string,
    applicationId: string,
    otherUserDetails: { displayName: string; photoURL?: string; role: "employer" | "employee" }
  ) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Listen to user's chats
  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
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
  }, [user?.uid]);

  // Calculate unread count
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    let count = 0;
    const unsubscribes: (() => void)[] = [];

    chats.forEach((chat) => {
      const messagesQuery = query(
        collection(db, "chats", chat.id, "messages"),
        where("read", "==", false),
        where("senderId", "!=", user.uid),
        limit(10)
      );

      const unsub = onSnapshot(messagesQuery, (snapshot) => {
        count += snapshot.size;
        setUnreadCount(count);
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [chats, user?.uid]);

  // Listen to messages for active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    const messagesQuery = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageData: Message[] = [];
        snapshot.forEach((doc) => {
          messageData.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(messageData);
        setMessagesLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setMessagesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeChat]);

  // Upload attachments
  const uploadAttachments = async (chatId: string, files: File[]): Promise<Attachment[]> => {
    const attachments: Attachment[] = [];

    for (const file of files) {
      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      attachments.push({
        name: file.name,
        url,
        type: file.type.startsWith("image/") ? "image" : "file",
        size: file.size,
      });
    }

    return attachments;
  };

  // Send message
  const sendMessage = useCallback(
    async (chatId: string, text: string, files?: File[]) => {
      if (!user?.uid || (!text.trim() && (!files || files.length === 0))) return;

      let attachments: Attachment[] | undefined;
      if (files && files.length > 0) {
        attachments = await uploadAttachments(chatId, files);
      }

      const messageData: Partial<Message> = {
        senderId: user.uid,
        text: text.trim(),
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        ...(attachments && { attachments }),
      };

      // Add message
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      // Update last message in chat
      const lastMessageText = attachments && attachments.length > 0 && !text.trim()
        ? `📎 ${attachments.length} attachment(s)`
        : text.trim();

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: {
          text: lastMessageText,
          senderId: user.uid,
          timestamp: serverTimestamp(),
        },
      });
    },
    [user?.uid]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (chatId: string) => {
      if (!user?.uid) return;

      const unreadQuery = query(
        collection(db, "chats", chatId, "messages"),
        where("read", "==", false),
        where("senderId", "!=", user.uid)
      );

      const snapshot = await getDocs(unreadQuery);
      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(updates);
    },
    [user?.uid]
  );

  // Create or get existing chat
  const createOrGetChat = useCallback(
    async (
      otherUserId: string,
      opportunityId: string,
      opportunityTitle: string,
      applicationId: string,
      otherUserDetails: { displayName: string; photoURL?: string; role: "employer" | "employee" }
    ): Promise<string> => {
      if (!user?.uid) throw new Error("Not authenticated");

      // Check for existing chat
      const existingQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
        where("applicationId", "==", applicationId)
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return existingSnapshot.docs[0].id;
      }

      // Get current user details
      const currentUserDoc = await getDoc(doc(db, "users", user.uid));
      const currentUserData = currentUserDoc.data();

      // Build participant details, excluding undefined values
      const currentUserParticipant: { displayName: string; photoURL?: string; role: "employer" | "employee" } = {
        displayName: currentUserData?.displayName || user.email || "Unknown",
        role: currentUserData?.role || "employee",
      };
      if (currentUserData?.photoURL) {
        currentUserParticipant.photoURL = currentUserData.photoURL;
      }

      const otherUserParticipant: { displayName: string; photoURL?: string; role: "employer" | "employee" } = {
        displayName: otherUserDetails.displayName,
        role: otherUserDetails.role,
      };
      if (otherUserDetails.photoURL) {
        otherUserParticipant.photoURL = otherUserDetails.photoURL;
      }

      // Create new chat
      const chatData = {
        participants: [user.uid, otherUserId],
        participantDetails: {
          [user.uid]: currentUserParticipant,
          [otherUserId]: otherUserParticipant,
        },
        opportunityId,
        opportunityTitle,
        applicationId,
        createdAt: serverTimestamp(),
      };

      const chatRef = await addDoc(collection(db, "chats"), chatData);
      return chatRef.id;
    },
    [user?.uid, user?.email]
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        loading,
        unreadCount,
        activeChat,
        messages,
        messagesLoading,
        setActiveChat,
        sendMessage,
        markAsRead,
        createOrGetChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
