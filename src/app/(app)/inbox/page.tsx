"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  MessageSquare, 
  Loader2, 
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { getNotificationIcon, getNotificationColor } from "@/types/notification-types";

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const { chats, loading: chatsLoading, activeChat, setActiveChat, unreadCount } = useChat();
  const { notifications, unreadCount: notifUnreadCount, markAsRead, markAllRead } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("messages");

  // Handle chat query parameter to open specific chat
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setActiveChat(chat);
        setActiveTab("messages");
      }
    }
  }, [searchParams, chats, setActiveChat]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
    <div className="h-[calc(100vh-58px)] flex flex-col -m-4 md:-m-6 p-2 overflow-hidden">
      {/* Header - compact */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Inbox</h1>
        </div>
      </div>

      {/* Tabs for Messages and Notifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start shrink-0 rounded-3xl">
          <TabsTrigger value="messages" className="gap-2 rounded-3xl">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-3xl">
            <Bell className="h-4 w-4" />
            Notifications
            {notifUnreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {notifUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 mt-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
            {/* Chat List */}
            <div className="md:col-span-1 border rounded-3xl overflow-hidden bg-card flex flex-col">
              <div className="p-3 border-b bg-muted/30 shrink-0">
                <h3 className="font-medium text-sm">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 rounded-3xl">
                <ChatList />
              </div>
            </div>

            {/* Chat Window */}
            <div className="md:col-span-3 rounded-3xl overflow-hidden flex flex-col">
              {activeChat ? (
                <ChatWindow 
                  showBackButton={true}
                  onBack={() => setActiveChat(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="flex-1 mt-4 min-h-0 overflow-y-auto">
          {/* Mark all read button */}
          {notifUnreadCount > 0 && (
            <div className="flex justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead()}
                className="text-xs"
              >
                Mark all as read
              </Button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm">
                You&apos;ll see updates about applications, followers, and more here
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.link) {
                        router.push(notification.link);
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "border-l-4 border-l-primary bg-primary/5"
                    )}
                  >
                    <div className={cn("shrink-0 mt-0.5 p-1.5 rounded-full", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.read ? "font-semibold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const ts = notification.createdAt as any;
                          const date = ts?.toDate ? ts.toDate() : new Date(ts);
                          return formatDistanceToNow(date, { addSuffix: true });
                        })()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
