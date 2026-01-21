"use client";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import Link from "next/link";
import { Bell, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { chats, unreadCount } = useChat();

  if (!user) {
    return null;
  }

  // Get recent unread chats for preview
  const recentChats = chats
    .filter(chat => chat.lastMessage && chat.lastMessage.senderId !== user.uid)
    .slice(0, 5);

  const getOtherParticipant = (chat: any) => {
    const otherId = chat.participants.find((p: string) => p !== user.uid);
    if (!otherId) return null;
    return {
      id: otherId,
      ...chat.participantDetails[otherId],
    };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {recentChats.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <>
            {recentChats.map((chat) => {
              const other = getOtherParticipant(chat);
              if (!other) return null;

              return (
                <DropdownMenuItem key={chat.id} asChild>
                  <Link href={`/inbox?chat=${chat.id}`} className="flex items-start gap-3 p-3 cursor-pointer">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={other.photoURL} />
                      <AvatarFallback className="bg-muted">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{other.displayName}</p>
                        {chat.lastMessage?.timestamp && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {chat.lastMessage?.text}
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/inbox" className="w-full text-center text-primary text-sm py-2">
            View all messages
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
