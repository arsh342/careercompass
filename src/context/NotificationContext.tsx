"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { AppNotification } from "@/types/notification-types";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllRead: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read ?? false,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
            link: data.link ?? undefined,
            actorId: data.actorId ?? undefined,
            actorName: data.actorName ?? undefined,
            actorPhotoURL: data.actorPhotoURL ?? undefined,
            metadata: data.metadata ?? undefined,
          };
        });
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error("Notification listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
