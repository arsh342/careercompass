"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { listenForIncomingCalls, CallData } from "@/lib/webrtc-signaling";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface IncomingCall {
  callId: string;
  callData: CallData;
}

interface CallContextType {
  incomingCall: IncomingCall | null;
  isInCall: boolean;
  acceptCall: () => void;
  rejectCall: () => void;
  setIsInCall: (value: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.uid) {
      console.log('[CallContext] No user, not listening for calls');
      return;
    }

    console.log('[CallContext] Setting up incoming call listener for user:', user.uid);
    
    const unsubscribe = listenForIncomingCalls(user.uid, (callId, callData) => {
      console.log('[CallContext] Received incoming call:', { callId, callData });
      
      // Don't show incoming call if already in a call
      if (isInCall) {
        console.log('[CallContext] Already in call, ignoring');
        return;
      }
      
      setIncomingCall({ callId, callData });
      
      // Play ringtone
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.log('[CallContext] Ringtone play failed:', e));
      }
    });

    return () => {
      console.log('[CallContext] Cleaning up call listener');
      unsubscribe();
    };
  }, [user?.uid, isInCall]);

  // Accept the incoming call
  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    
    // Stop ringtone
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Navigate to video call page
    const { callId, callData } = incomingCall;
    const params = new URLSearchParams({
      callId,
      recipientId: callData.callerId,
      recipientName: callData.callerName,
      isCallee: "true",
    });
    
    window.location.href = `/chat/video?${params.toString()}`;
    setIncomingCall(null);
  }, [incomingCall]);

  // Reject the incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // Stop ringtone
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Update call status in Firebase
    const callRef = doc(db, "calls", incomingCall.callId);
    await updateDoc(callRef, { status: "rejected" });
    
    setIncomingCall(null);
  }, [incomingCall]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        isInCall,
        acceptCall,
        rejectCall,
        setIsInCall,
      }}
    >
      {children}
      {/* Hidden audio element for ringtone */}
      <audio
        ref={audioRef}
        src="/sounds/ringtone.mp3"
        loop
        preload="auto"
      />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
