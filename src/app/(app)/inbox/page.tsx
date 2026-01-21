"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar,
  UserCheck,
  Mail,
  Bell,
  ArrowLeft
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface StatusUpdate {
  id: string;
  type: "status_change" | "interview" | "message";
  opportunityId: string;
  opportunityTitle: string;
  employerName: string;
  status: string;
  message?: string;
  timestamp: Timestamp;
  read: boolean;
}

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const { chats, loading: chatsLoading, activeChat, setActiveChat, unreadCount } = useChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Listen for application status changes
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const applicationsQuery = query(
      collection(db, "applications"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      async (snapshot) => {
        const updates: StatusUpdate[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Only show applications with meaningful status updates
          if (data.status && data.status !== "Submitted") {
            updates.push({
              id: doc.id,
              type: data.status === "Interview" ? "interview" : "status_change",
              opportunityId: data.opportunityId,
              opportunityTitle: data.opportunityTitle || "Job Application",
              employerName: data.employerName || "Employer",
              status: data.status,
              message: getStatusMessage(data.status),
              timestamp: data.updatedAt || data.submittedAt,
              read: data.read || false,
            });
          }
        }
        
        setNotifications(updates);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusMessage = (status: string): string => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Congratulations! Your application has been approved.";
      case "rejected":
        return "Unfortunately, your application was not selected.";
      case "interview":
        return "You've been invited for an interview!";
      case "invited":
        return "You've been invited to apply for this position.";
      case "hired":
        return "Congratulations! You've been hired!";
      default:
        return `Your application status has been updated to: ${status}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "hired":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "interview":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "invited":
        return <UserCheck className="h-5 w-5 text-amber-500" />;
      default:
        return <Mail className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "hired":
        return "default";
      case "rejected":
        return "destructive";
      case "interview":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (authLoading || loading) {
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
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {notifications.filter(n => !n.read).length}
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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No updates yet</p>
              <p className="text-sm">
                You&apos;ll see important updates about your applications here
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {notifications.map((notification) => (
                <Link 
                  key={notification.id}
                  href={`/opportunities/${notification.opportunityId}`}
                  className={cn(
                    "block p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors",
                    !notification.read && "border-l-4 border-l-primary"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {getStatusIcon(notification.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {notification.opportunityTitle}
                        </p>
                        <Badge variant={getStatusBadgeVariant(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.employerName}
                      </p>
                      <p className="text-sm text-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp?.toDate 
                          ? formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true })
                          : "Recently"
                        }
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
