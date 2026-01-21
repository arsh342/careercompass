"use client";

import { useChat, Chat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Loader2, User } from "lucide-react";

export function ChatList() {
  const { chats, loading, activeChat, setActiveChat, markAsRead } = useChat();
  const { user } = useAuth();

  const getOtherParticipant = (chat: Chat) => {
    if (!user?.uid) return null;
    const otherId = chat.participants.find((p) => p !== user.uid);
    if (!otherId) return null;
    return {
      id: otherId,
      ...chat.participantDetails[otherId],
    };
  };

  const handleChatClick = async (chat: Chat) => {
    setActiveChat(chat);
    await markAsRead(chat.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start chatting with employers or applicants</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {chats.map((chat) => {
        const other = getOtherParticipant(chat);
        if (!other) return null;

        const isActive = activeChat?.id === chat.id;
        const isUnread =
          chat.lastMessage?.senderId !== user?.uid &&
          chat.lastMessage?.timestamp;

        return (
          <button
            key={chat.id}
            onClick={() => handleChatClick(chat)}
            className={cn(
              "flex items-start gap-2 p-3 rounded-2xl text-left transition-colors w-full",
              isActive
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted/50"
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={other.photoURL} />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-medium truncate", isUnread && "text-foreground")}>
                  {other.displayName}
                </p>
                {chat.lastMessage?.timestamp && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
              </p>
              {chat.lastMessage && (
                <p
                  className={cn(
                    "text-sm truncate",
                    isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {chat.lastMessage.senderId === user?.uid}
                  {chat.lastMessage.text}
                </p>
              )}
            </div>
            {isUnread && (
              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}
