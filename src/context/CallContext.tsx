"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { listenForIncomingCalls, CallData } from "@/lib/webrtc-service";
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current !== null) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  const playRingtoneBurst = useCallback(() => {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const gainNode = context.createGain();
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.connect(gainNode);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }, []);

  const startRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current !== null) {
      return;
    }

    playRingtoneBurst();
    ringtoneIntervalRef.current = window.setInterval(() => {
      playRingtoneBurst();
    }, 1500);
  }, [playRingtoneBurst]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenForIncomingCalls(user.uid, (callDataWithId) => {
      
      // Don't show incoming call if already in a call
      if (isInCall) return;
      
      // Don't show if already on the video page for this call
      if (typeof window !== 'undefined' && window.location.pathname.includes('/video-call')) {
        return;
      }
      
      setIncomingCall({ callId: callDataWithId.callId, callData: callDataWithId });
      startRingtone();
    });

    return () => {
      stopRingtone();
      unsubscribe();
    };
  }, [user?.uid, isInCall, startRingtone, stopRingtone]);

  // Accept the incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    stopRingtone();
    
    // Mark as in call BEFORE navigating to prevent listener from firing again
    setIsInCall(true);
    
    // Update call status in Firestore to "answering" BEFORE navigation
    // This prevents the listener on the video page from showing the modal
    const callRef = doc(db, "calls", incomingCall.callId);
    await updateDoc(callRef, { status: "answering" });
    
    // Navigate to video call page
    const { callId, callData } = incomingCall;
    const params = new URLSearchParams({
      callId,
      recipientId: callData.callerId,
      recipientName: callData.callerName,
      isCallee: "true",
    });
    
    // Clear incoming call state
    setIncomingCall(null);
    
    window.location.href = `/video-call?${params.toString()}`;
  }, [incomingCall, stopRingtone]);

  // Reject the incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    
    stopRingtone();
    
    // Update call status in Firebase
    const callRef = doc(db, "calls", incomingCall.callId);
    await updateDoc(callRef, { status: "rejected" });
    
    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

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
