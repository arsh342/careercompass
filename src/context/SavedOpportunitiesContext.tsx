'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

interface Opportunity {
  id: string;
  [key: string]: any;
}

interface SavedOpportunitiesContextType {
  saved: Opportunity[];
  setSaved: Dispatch<SetStateAction<Opportunity[]>>;
  toggleSave: (opportunity: Opportunity) => void;
  loading: boolean;
}

const SavedOpportunitiesContext = createContext<SavedOpportunitiesContextType | undefined>(undefined);

export const SavedOpportunitiesProvider = ({ children }: { children: ReactNode }) => {
  const [saved, setSaved] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load saved opportunities from Firestore
  useEffect(() => {
    if (!user) {
      setSaved([]);
      setLoading(false);
      return;
    }

    const savedRef = collection(db, 'users', user.uid, 'savedOpportunities');
    
    const unsubscribe = onSnapshot(savedRef, (snapshot) => {
      const opportunities: Opportunity[] = [];
      snapshot.forEach((doc) => {
        opportunities.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setSaved(opportunities);
      setLoading(false);
    }, (error) => {
      console.error('Error loading saved opportunities:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleSave = async (opportunity: Opportunity) => {
    if (!user) return;

    const isSaved = saved.some(item => item.id === opportunity.id);
    const savedDocRef = doc(db, 'users', user.uid, 'savedOpportunities', opportunity.id);

    try {
      if (isSaved) {
        // Remove from saved
        await deleteDoc(savedDocRef);
      } else {
        // Add to saved
        await setDoc(savedDocRef, {
          ...opportunity,
          savedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  return (
    <SavedOpportunitiesContext.Provider value={{ saved, setSaved, toggleSave, loading }}>
      {children}
    </SavedOpportunitiesContext.Provider>
  );
};

export const useSavedOpportunities = () => {
  const context = useContext(SavedOpportunitiesContext);
  if (context === undefined) {
    throw new Error('useSavedOpportunities must be used within a SavedOpportunitiesProvider');
  }
  return context;
};
