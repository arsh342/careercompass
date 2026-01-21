"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  isCryptoSupported,
} from "@/lib/crypto";
import {
  storeKeys,
  getKeys,
  hasKeys,
  isIndexedDBSupported,
} from "@/lib/key-storage";

// ============================================
// TYPES
// ============================================

interface EncryptionContextType {
  isReady: boolean;
  isSupported: boolean;
  publicKey: string | null;
  encrypt: (message: string, recipientId: string) => Promise<{ ciphertext: string; iv: string } | null>;
  decrypt: (ciphertext: string, iv: string, senderId: string) => Promise<string | null>;
  ensureKeys: () => Promise<boolean>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [sharedKeyCache, setSharedKeyCache] = useState<Map<string, CryptoKey>>(new Map());

  const isSupported = typeof window !== "undefined" && isCryptoSupported() && isIndexedDBSupported();

  // Initialize keys when user logs in
  useEffect(() => {
    if (!user?.uid || !isSupported) {
      setIsReady(false);
      setPublicKey(null);
      setPrivateKey(null);
      return;
    }

    const initializeKeys = async () => {
      try {
        // Check if we have keys in IndexedDB
        const storedKeys = await getKeys(user.uid);
        
        if (storedKeys) {
          // Import existing keys
          const importedPrivate = await importPrivateKey(storedKeys.privateKey);
          setPrivateKey(importedPrivate);
          setPublicKey(storedKeys.publicKey);
          setIsReady(true);
        } else {
          // Check if there's a public key in Firestore but we lost the private key
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();
          
          if (userData?.encryptionPublicKey) {
            // We have a public key but no private key - need to regenerate
            console.warn("Private key lost, needs regeneration");
            setIsReady(false);
          } else {
            // No keys exist yet, will be generated on first message
            setIsReady(false);
          }
        }
      } catch (error) {
        console.error("Error initializing encryption:", error);
        setIsReady(false);
      }
    };

    initializeKeys();
  }, [user?.uid, isSupported]);

  // Ensure keys exist (generate if needed)
  const ensureKeys = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !isSupported) return false;
    
    if (privateKey && publicKey) return true;

    try {
      // Generate new key pair
      const keyPair = await generateKeyPair();
      const exportedPublic = await exportPublicKey(keyPair.publicKey);
      const exportedPrivate = await exportPrivateKey(keyPair.privateKey);

      // Store in IndexedDB
      await storeKeys(user.uid, exportedPublic, exportedPrivate);

      // Store public key in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        encryptionPublicKey: exportedPublic,
      }).catch(() => {
        // If update fails (doc doesn't exist), try setDoc with merge
        return setDoc(doc(db, "users", user.uid), {
          encryptionPublicKey: exportedPublic,
        }, { merge: true });
      });

      setPrivateKey(keyPair.privateKey);
      setPublicKey(exportedPublic);
      setIsReady(true);

      return true;
    } catch (error) {
      console.error("Error generating keys:", error);
      return false;
    }
  }, [user?.uid, isSupported, privateKey, publicKey]);

  // Get or derive shared key for a specific user
  const getSharedKey = useCallback(async (otherUserId: string): Promise<CryptoKey | null> => {
    if (!privateKey) return null;

    // Check cache
    const cached = sharedKeyCache.get(otherUserId);
    if (cached) return cached;

    try {
      // Get other user's public key from Firestore
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
      const otherUserData = otherUserDoc.data();
      
      if (!otherUserData?.encryptionPublicKey) {
        console.warn("Other user has no encryption key");
        return null;
      }

      // Import their public key and derive shared key
      const otherPublicKey = await importPublicKey(otherUserData.encryptionPublicKey);
      const sharedKey = await deriveSharedKey(privateKey, otherPublicKey);

      // Cache it
      setSharedKeyCache(prev => new Map(prev).set(otherUserId, sharedKey));

      return sharedKey;
    } catch (error) {
      console.error("Error deriving shared key:", error);
      return null;
    }
  }, [privateKey, sharedKeyCache]);

  // Encrypt a message for a recipient
  const encrypt = useCallback(async (
    message: string,
    recipientId: string
  ): Promise<{ ciphertext: string; iv: string } | null> => {
    if (!isReady) {
      const ready = await ensureKeys();
      if (!ready) return null;
    }

    const sharedKey = await getSharedKey(recipientId);
    if (!sharedKey) return null;

    try {
      return await encryptMessage(message, sharedKey);
    } catch (error) {
      console.error("Error encrypting message:", error);
      return null;
    }
  }, [isReady, ensureKeys, getSharedKey]);

  // Decrypt a message from a sender
  const decrypt = useCallback(async (
    ciphertext: string,
    iv: string,
    senderId: string
  ): Promise<string | null> => {
    if (!isReady || !privateKey) return null;

    const sharedKey = await getSharedKey(senderId);
    if (!sharedKey) return null;

    try {
      return await decryptMessage(ciphertext, iv, sharedKey);
    } catch (error) {
      console.error("Error decrypting message:", error);
      return null;
    }
  }, [isReady, privateKey, getSharedKey]);

  return (
    <EncryptionContext.Provider
      value={{
        isReady,
        isSupported,
        publicKey,
        encrypt,
        decrypt,
        ensureKeys,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error("useEncryption must be used within an EncryptionProvider");
  }
  return context;
}
