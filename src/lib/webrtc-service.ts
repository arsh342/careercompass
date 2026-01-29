"use client";

import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";

// ICE servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Types
export interface CallData {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  opportunityId?: string;
  opportunityTitle?: string;
  status: "ringing" | "active" | "ended" | "rejected";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: Timestamp;
}

export interface CallCallbacks {
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onCallEnded: () => void;
}

/**
 * WebRTC Call Manager - handles a single video call
 * Design: Simple, linear flow with clear state management
 */
export class WebRTCCall {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private isCleanedUp = false;

  constructor(
    private callId: string,
    private userId: string,
    private isCaller: boolean,
    private callbacks: CallCallbacks
  ) {}

  /**
   * Initialize media (camera + microphone)
   */
  async getMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      this.callbacks.onLocalStream(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error("[WebRTC] Failed to get media:", error);
      return null;
    }
  }

  /**
   * Create peer connection and set up event handlers
   */
  private createPeerConnection(): RTCPeerConnection {
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Handle incoming tracks
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track);
      });
      this.callbacks.onRemoteStream(this.remoteStream!);
    };

    // Handle ICE candidates - save to Firestore
    this.pc.onicecandidate = async (event) => {
      if (event.candidate && !this.isCleanedUp) {
        const candidateCollection = this.isCaller ? "callerCandidates" : "calleeCandidates";
        await addDoc(collection(db, "calls", this.callId, candidateCollection), {
          ...event.candidate.toJSON(),
        });
      }
    };



    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.callbacks.onConnectionStateChange(this.pc.connectionState);
      }
    };

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    return this.pc;
  }

  /**
   * Start a call (caller side)
   */
  async startCall(
    callerName: string,
    calleeId: string,
    calleeName: string,
    opportunityId?: string,
    opportunityTitle?: string
  ): Promise<void> {
    if (this.isCleanedUp) return;

    // Create peer connection
    this.createPeerConnection();

    // Create offer
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);

    // Save call to Firestore with status "ringing"
    const callDoc = doc(db, "calls", this.callId);
    await setDoc(callDoc, {
      callerId: this.userId,
      callerName,
      calleeId,
      calleeName,
      opportunityId: opportunityId || null,
      opportunityTitle: opportunityTitle || null,
      status: "ringing",
      offer: { type: offer.type, sdp: offer.sdp },
      createdAt: serverTimestamp(),
    });

    // Listen for answer
    const unsubAnswer = onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data() as CallData | undefined;
      if (data?.answer && this.pc && !this.pc.currentRemoteDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      if (data?.status === "ended" || data?.status === "rejected") {
        this.callbacks.onCallEnded();
      }
    });
    this.unsubscribers.push(unsubAnswer);

    // Listen for callee's ICE candidates
    const unsubCandidates = onSnapshot(
      collection(db, "calls", this.callId, "calleeCandidates"),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" && this.pc) {
            const data = change.doc.data();
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(data));
            } catch (e) {
              console.error('[WebRTC] Error adding ICE candidate:', e);
            }
          }
        });
      }
    );
    this.unsubscribers.push(unsubCandidates);
  }

  /**
   * Answer a call (callee side)
   */
  async answerCall(): Promise<void> {
    if (this.isCleanedUp) return;

    // Get call data first
    const callDoc = doc(db, "calls", this.callId);
    let hasAnswered = false; // Guard to prevent processing multiple times
    
    return new Promise((resolve, reject) => {
      const unsub = onSnapshot(callDoc, async (snapshot) => {
        // Guard: only process once
        if (hasAnswered || this.isCleanedUp) return;
        
        const data = snapshot.data() as CallData | undefined;
        
        if (!data?.offer) {
          return; // Wait for offer
        }

        // Set flag immediately to prevent re-entry
        hasAnswered = true;

        try {
          // Create peer connection
          this.createPeerConnection();

          // Set remote description from offer
          await this.pc!.setRemoteDescription(new RTCSessionDescription(data.offer));

          // Create and set answer
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);

          // Save answer to Firestore
          await updateDoc(callDoc, {
            answer: { type: answer.type, sdp: answer.sdp },
            status: "active",
          });

          // Listen for caller's ICE candidates
          const unsubCandidates = onSnapshot(
            collection(db, "calls", this.callId, "callerCandidates"),
            (candidateSnapshot) => {
              candidateSnapshot.docChanges().forEach(async (change) => {
                if (change.type === "added" && this.pc) {
                  const candidateData = change.doc.data();
                  try {
                    await this.pc.addIceCandidate(new RTCIceCandidate(candidateData));
                  } catch (e) {
                    console.error('[WebRTC] Error adding ICE candidate:', e);
                  }
                }
              });
            }
          );
          this.unsubscribers.push(unsubCandidates);

          // Listen for call status changes
          const unsubStatus = onSnapshot(callDoc, (statusSnapshot) => {
            const statusData = statusSnapshot.data() as CallData | undefined;
            if (statusData?.status === "ended") {
              this.callbacks.onCallEnded();
            }
          });
          this.unsubscribers.push(unsubStatus);

          unsub(); // Stop listening for offer
          resolve();
        } catch (error) {
          unsub();
          reject(error);
        }
      });
      
      this.unsubscribers.push(unsub);
    });
  }

  /**
   * End the call and cleanup
   */
  async endCall(): Promise<void> {
    if (this.isCleanedUp) return;
    this.isCleanedUp = true;

    // Update Firestore
    try {
      const callDoc = doc(db, "calls", this.callId);
      await updateDoc(callDoc, { status: "ended" });
    } catch (error) {
      console.error("[WebRTC] Error updating call status:", error);
    }

    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.isCleanedUp = true;

    // Unsubscribe from all listeners
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteStream = null;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }
}

/**
 * Generate a unique call ID
 */
export function generateCallId(callerId: string, calleeId: string): string {
  return `${callerId}_${calleeId}_${Date.now()}`;
}

/**
 * Listen for incoming calls
 */
export function listenForIncomingCalls(
  userId: string,
  onIncomingCall: (callData: CallData & { callId: string }) => void
): Unsubscribe {
  // Track calls we've already notified about to avoid duplicates
  const notifiedCalls = new Set<string>();
  
  return onSnapshot(collection(db, "calls"), (snapshot) => {
    
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as CallData;
      const callId = change.doc.id;
      
      // Check if this is a ringing call for us that we haven't notified about
      if (data.calleeId === userId && data.status === "ringing" && !notifiedCalls.has(callId)) {
        // Only show modal for calls created in the last 60 seconds
        // This prevents old calls from previous sessions from showing
        const callCreatedAt = data.createdAt?.toDate?.() || new Date(0);
        const ageSeconds = (Date.now() - callCreatedAt.getTime()) / 1000;
        
        if (ageSeconds > 60) {
          notifiedCalls.add(callId); // Mark as notified so we don't check again
          return;
        }
        
        notifiedCalls.add(callId);
        onIncomingCall({ ...data, callId });
      }
    });
  });
}
