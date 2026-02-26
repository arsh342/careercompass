"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatList, Chat } from "@/hooks/useChatList";
import { useChatMessages, Message } from "@/hooks/useChatMessages";
import { useChatActions } from "@/hooks/useChatActions";

// ============================================
// CONTEXT TYPE
// ============================================

interface ChatContextType {
  // Chat list
  chats: Chat[];
  loading: boolean;
  unreadCount: number;

  // Active chat & messages
  activeChat: Chat | null;
  messages: Message[];
  messagesLoading: boolean;
  setActiveChat: (chat: Chat | null) => void;

  // Actions
  sendMessage: (
    chatId: string,
    text: string,
    files?: File[],
    encryption?: { ciphertext: string; iv: string }
  ) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createOrGetChat: (
    otherUserId: string,
    opportunityId: string,
    opportunityTitle: string,
    applicationId: string,
    otherUserDetails: {
      displayName: string;
      photoURL?: string;
      role: "employer" | "employee";
    }
  ) => Promise<string>;
  startDirectMessage: (
    otherUserId: string,
    otherUserDetails: {
      displayName: string;
      photoURL?: string;
      role: "employer" | "employee";
    }
  ) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============================================
// PROVIDER (composes focused hooks)
// ============================================

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<Chat | null>(null);

  // Compose the focused hooks
  const { chats, loading, unreadCount } = useChatList(user?.uid);
  const { messages, messagesLoading } = useChatMessages(activeChat?.id ?? null, user?.uid);
  const { sendMessage, markAsRead, createOrGetChat, startDirectMessage } =
    useChatActions(user?.uid, user?.email ?? undefined);

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
        startDirectMessage,
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

// Re-export types for consumers
export type { Chat, Message };
export type { Attachment } from "@/hooks/useChatMessages";
