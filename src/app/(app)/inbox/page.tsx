"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  Bell
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
  const router = useRouter();
  const [notifications, setNotifications] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container mx-auto py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Important updates about your applications
          </p>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No updates yet</p>
          <p className="text-sm">
            You&apos;ll see important updates about your applications here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
    </div>
  );
}
