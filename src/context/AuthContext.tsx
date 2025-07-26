
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { app, db } from '@/lib/firebase'; // Ensure you have this file

interface UserProfile {
    role: string;
    [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const unsubscribeProfile = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const profileData = doc.data() as UserProfile;
                setRole(profileData.role);
                setUserProfile(profileData);
            }
            setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setRole(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading, role, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
