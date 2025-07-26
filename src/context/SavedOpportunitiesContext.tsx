
'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface Opportunity {
  id: string;
  [key: string]: any;
}

interface SavedOpportunitiesContextType {
  saved: Opportunity[];
  setSaved: Dispatch<SetStateAction<Opportunity[]>>;
  toggleSave: (opportunity: Opportunity) => void;
}

const SavedOpportunitiesContext = createContext<SavedOpportunitiesContextType | undefined>(undefined);

export const SavedOpportunitiesProvider = ({ children }: { children: ReactNode }) => {
  const [saved, setSaved] = useState<Opportunity[]>([]);

  const toggleSave = (opportunity: Opportunity) => {
    setSaved(prevSaved => {
      const isSaved = prevSaved.some(item => item.id === opportunity.id);
      if (isSaved) {
        return prevSaved.filter(item => item.id !== opportunity.id);
      } else {
        return [...prevSaved, opportunity];
      }
    });
  };

  return (
    <SavedOpportunitiesContext.Provider value={{ saved, setSaved, toggleSave }}>
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
