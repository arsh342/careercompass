"use client";

import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  UserPlus,
  MessageSquare,
  Heart,
  Target,
  CheckCheck,
  User,
} from "lucide-react";
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
import type { AppNotification, NotificationType } from "@/types/notification-types";

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  application_update: Briefcase,
  new_applicant: UserPlus,
  new_message: MessageSquare,
  new_follower: Heart,
  job_match: Target,
  system: Bell,
};

const COLOR_MAP: Record<NotificationType, string> = {
  application_update: "text-blue-500",
  new_applicant: "text-green-500",
  new_message: "text-purple-500",
  new_follower: "text-pink-500",
  job_match: "text-amber-500",
  system: "text-muted-foreground",
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();
  const router = useRouter();

  if (!user) {
    return null;
  }

  // Show the 8 most recent notifications
  const recentNotifications = notifications.slice(0, 8);

  const handleClick = async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllRead();
              }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => {
              const Icon = ICON_MAP[notification.type] || Bell;
              const colorClass = COLOR_MAP[notification.type] || "";

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${
                    !notification.read ? "bg-primary/[0.03]" : ""
                  }`}
                  onClick={() => handleClick(notification)}
                >
                  {notification.actorPhotoURL ? (
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={notification.actorPhotoURL} />
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="shrink-0 mt-0.5">
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm truncate ${
                          !notification.read ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="w-full text-center text-primary text-sm py-2"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
