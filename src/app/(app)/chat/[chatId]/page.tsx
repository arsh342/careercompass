"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatProvider, useChat } from "@/context/ChatContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function ChatRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, userProfile } = useAuth();
  const { chats, loading: chatsLoading, activeChat, setActiveChat, createOrGetChat } = useChat();
  const [creating, setCreating] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const processedRef = useRef(false);
  const activatedRef = useRef(false);

  const chatId = params.chatId as string;

  // Determine back link based on user role
  const isEmployer = userProfile?.role === "employer";
  const backLink = isEmployer 
    ? activeChat?.opportunityId 
      ? `/employer/postings/${activeChat.opportunityId}/applicants`
      : "/employer/postings"
    : "/applications";
  const backLabel = isEmployer ? "Back to Applicants" : "Back to Applications";

  // Function to load chat directly from Firestore if not in context
  const loadChatDirectly = useCallback(async (id: string) => {
    if (!user?.uid) return null;
    try {
      const chatDoc = await getDoc(doc(db, "chats", id));
      if (chatDoc.exists()) {
        return { id: chatDoc.id, ...chatDoc.data() };
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
    return null;
  }, [user?.uid]);

  // Set active chat based on URL - either from context or load directly
  useEffect(() => {
    if (chatsLoading || !chatId || chatId === "new" || activatedRef.current) return;
    
    // First try to find in existing chats
    const existingChat = chats.find((c) => c.id === chatId);
    if (existingChat) {
      setActiveChat(existingChat);
      activatedRef.current = true;
      return;
    }

    // If not found in context, load directly from Firestore
    const loadChat = async () => {
      setLoadingChat(true);
      const chat = await loadChatDirectly(chatId);
      if (chat) {
        setActiveChat(chat as any);
        activatedRef.current = true;
      }
      setLoadingChat(false);
    };

    loadChat();
  }, [chatId, chats, chatsLoading, setActiveChat, loadChatDirectly]);

  // Create new chat from URL params
  useEffect(() => {
    const createNewChat = async () => {
      if (chatId !== "new" || !user || processedRef.current || creating) return;

      const userId = searchParams.get("userId");
      const userName = searchParams.get("userName");
      const opportunityId = searchParams.get("opportunityId");
      const opportunityTitle = searchParams.get("opportunityTitle");
      const applicationId = searchParams.get("applicationId");

      if (userId && opportunityId && opportunityTitle && applicationId && userName) {
        processedRef.current = true;
        setCreating(true);
        try {
          const newChatId = await createOrGetChat(
            userId,
            opportunityId,
            opportunityTitle,
            applicationId,
            {
              displayName: userName,
              photoURL: searchParams.get("userPhoto") || undefined,
              role: "employee",
            }
          );
          
          // Reset activation ref for the new chat ID
          activatedRef.current = false;
          
          // Navigate to the actual chat room
          router.replace(`/chat/${newChatId}`);
        } catch (error) {
          console.error("Error creating chat:", error);
          processedRef.current = false;
        } finally {
          setCreating(false);
        }
      }
    };

    createNewChat();
  }, [chatId, user, searchParams, createOrGetChat, router, creating]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || creating || loadingChat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backLink}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </Button>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <ChatProvider>
      <ChatRoomContent />
    </ChatProvider>
  );
}
