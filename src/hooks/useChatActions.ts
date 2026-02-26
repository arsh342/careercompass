"use client";

import { useCallback } from "react";
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Attachment } from "./useChatMessages";

// ============================================
// HOOK: useChatActions
// ============================================

/**
 * Provides chat action functions: send message, mark as read,
 * create/get chat, start direct message, and upload attachments.
 * All functions require an authenticated userId.
 */
export function useChatActions(userId: string | undefined, userEmail: string | undefined) {

  // Upload attachments to Firebase Storage
  const uploadAttachments = useCallback(
    async (chatId: string, files: File[]): Promise<Attachment[]> => {
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
    },
    []
  );

  // Send a message (plain text or encrypted)
  const sendMessage = useCallback(
    async (
      chatId: string,
      text: string,
      files?: File[],
      encryption?: { ciphertext: string; iv: string }
    ) => {
      if (!userId || (!text.trim() && (!files || files.length === 0))) return;

      let attachments: Attachment[] | undefined;
      if (files && files.length > 0) {
        attachments = await uploadAttachments(chatId, files);
      }

      // Build message data
      const messageData: Record<string, unknown> = {
        senderId: userId,
        timestamp: serverTimestamp(),
        read: false,
        ...(attachments && { attachments }),
      };

      if (encryption) {
        messageData.encrypted = true;
        messageData.ciphertext = encryption.ciphertext;
        messageData.iv = encryption.iv;
        messageData.text = "";
      } else {
        messageData.text = text.trim();
      }

      // Add message to subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      // Update last message preview on the chat
      const lastMessageText =
        attachments && attachments.length > 0 && !text.trim()
          ? `📎 ${attachments.length} attachment(s)`
          : text.trim();

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: {
          text: lastMessageText,
          senderId: userId,
          timestamp: serverTimestamp(),
        },
      });
    },
    [userId, uploadAttachments]
  );

  // Mark all unread messages in a chat as read
  const markAsRead = useCallback(
    async (chatId: string) => {
      if (!userId) return;

      const unreadQuery = query(
        collection(db, "chats", chatId, "messages"),
        where("read", "==", false),
        where("senderId", "!=", userId)
      );

      const snapshot = await getDocs(unreadQuery);
      const updates = snapshot.docs.map((d) => updateDoc(d.ref, { read: true }));
      await Promise.all(updates);
    },
    [userId]
  );

  // Create or find an existing chat for an application
  const createOrGetChat = useCallback(
    async (
      otherUserId: string,
      opportunityId: string,
      opportunityTitle: string,
      applicationId: string,
      otherUserDetails: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      }
    ): Promise<string> => {
      if (!userId) throw new Error("Not authenticated");

      // Check for existing chat
      const existingQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", userId),
        where("applicationId", "==", applicationId)
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return existingSnapshot.docs[0].id;
      }

      // Get current user details
      const currentUserDoc = await getDoc(doc(db, "users", userId));
      const currentUserData = currentUserDoc.data();

      const currentUserParticipant: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      } = {
        displayName: currentUserData?.displayName || userEmail || "Unknown",
        role: currentUserData?.role || "employee",
      };
      if (currentUserData?.photoURL) {
        currentUserParticipant.photoURL = currentUserData.photoURL;
      }

      const otherUserParticipant: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      } = {
        displayName: otherUserDetails.displayName,
        role: otherUserDetails.role,
      };
      if (otherUserDetails.photoURL) {
        otherUserParticipant.photoURL = otherUserDetails.photoURL;
      }

      // Create new chat
      const chatData = {
        participants: [userId, otherUserId],
        participantDetails: {
          [userId]: currentUserParticipant,
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
    [userId, userEmail]
  );

  // Start a direct message conversation (no opportunity/application needed)
  const startDirectMessage = useCallback(
    async (
      otherUserId: string,
      otherUserDetails: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      }
    ): Promise<string> => {
      if (!userId) throw new Error("Not authenticated");

      // Check for existing direct message chat
      const existingQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", userId),
        where("type", "==", "direct")
      );

      const existingSnapshot = await getDocs(existingQuery);
      const existingChat = existingSnapshot.docs.find((d) => {
        const data = d.data();
        return data.participants.includes(otherUserId);
      });

      if (existingChat) {
        return existingChat.id;
      }

      // Get current user details
      const currentUserDoc = await getDoc(doc(db, "users", userId));
      const currentUserData = currentUserDoc.data();

      const currentUserParticipant: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      } = {
        displayName: currentUserData?.displayName || userEmail || "Unknown",
        role: currentUserData?.role || "employee",
      };
      if (currentUserData?.photoURL) {
        currentUserParticipant.photoURL = currentUserData.photoURL;
      }

      const otherUserParticipant: {
        displayName: string;
        photoURL?: string;
        role: "employer" | "employee";
      } = {
        displayName: otherUserDetails.displayName,
        role: otherUserDetails.role,
      };
      if (otherUserDetails.photoURL) {
        otherUserParticipant.photoURL = otherUserDetails.photoURL;
      }

      const chatData = {
        type: "direct",
        participants: [userId, otherUserId],
        participantDetails: {
          [userId]: currentUserParticipant,
          [otherUserId]: otherUserParticipant,
        },
        createdAt: serverTimestamp(),
      };

      const chatRef = await addDoc(collection(db, "chats"), chatData);
      return chatRef.id;
    },
    [userId, userEmail]
  );

  return {
    sendMessage,
    markAsRead,
    createOrGetChat,
    startDirectMessage,
  };
}
