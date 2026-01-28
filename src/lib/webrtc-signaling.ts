"use client";

import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// STUN/TURN servers for WebRTC
// Using free public STUN and TURN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Google STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Open Relay TURN servers (free tier)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
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

export interface CallData {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  opportunityId?: string;
  opportunityTitle?: string;
  status: "ringing" | "active" | "ended" | "rejected" | "missed";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: Timestamp;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment: string | null;
}

export class WebRTCSignaling {
  private _peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callDocRef: ReturnType<typeof doc> | null = null;
  private unsubscribeCall: (() => void) | null = null;
  private unsubscribeCandidates: (() => void) | null = null;

  constructor(
    private callId: string,
    private userId: string,
    private isCaller: boolean
  ) {}

  // Public getter for peer connection
  get peerConnection(): RTCPeerConnection | null {
    return this._peerConnection;
  }

  // Initialize peer connection
  initializePeerConnection(
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection {
    this._peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Handle remote tracks
    this._peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track);
      });
      onRemoteStream(this.remoteStream!);
    };

    // Handle ICE candidates
    this._peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    this._peerConnection.onconnectionstatechange = () => {
      onConnectionStateChange(this._peerConnection!.connectionState);
    };

    return this._peerConnection;
  }

  // Add local stream to peer connection
  addLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach((track) => {
      this._peerConnection!.addTrack(track, stream);
    });
  }

  // Add remote ICE candidate
  async addRemoteIceCandidate(candidateInit: RTCIceCandidateInit) {
    if (this._peerConnection) {
      const candidate = new RTCIceCandidate(candidateInit);
      await this._peerConnection.addIceCandidate(candidate);
    }
  }

  // Create a call (caller side)
  async createCall(
    callerName: string,
    calleeId: string,
    calleeName: string,
    opportunityId?: string,
    opportunityTitle?: string
  ): Promise<RTCSessionDescriptionInit> {
    console.log('[WebRTC] Creating call:', {
      callId: this.callId,
      callerId: this.userId,
      callerName,
      calleeId,
      calleeName,
      opportunityId,
    });
    
    try {
      const callDocRef = doc(db, "calls", this.callId);
      this.callDocRef = callDocRef;

      // STEP 1: Save initial call document FIRST (before WebRTC operations)
      const initialCallData = {
        callerId: this.userId,
        callerName,
        calleeId,
        calleeName,
        opportunityId,
        opportunityTitle,
        status: "ringing",
        createdAt: serverTimestamp(),
      };

      console.log('[WebRTC] STEP 1: Saving initial call to Firestore...');
      await setDoc(callDocRef, initialCallData);
      console.log('[WebRTC] STEP 1 COMPLETE: Call saved to Firestore!');

      // STEP 2: Create WebRTC offer
      if (!this._peerConnection) {
        throw new Error('Peer connection not initialized. Call initializePeerConnection first.');
      }
      
      console.log('[WebRTC] STEP 2: Creating offer...');
      const offer = await this._peerConnection.createOffer();
      console.log('[WebRTC] STEP 2: Offer created, setting local description...');
      await this._peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] STEP 2 COMPLETE: Local description set');

      // STEP 3: Update call document with offer
      console.log('[WebRTC] STEP 3: Updating call with offer...');
      await updateDoc(callDocRef, {
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
      console.log('[WebRTC] STEP 3 COMPLETE: Call updated with offer');
      
      return offer;
    } catch (error) {
      console.error('[WebRTC] Error in createCall:', error);
      throw error;
    }
  }

  // Answer a call (callee side)
  async answerCall(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this._peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this._peerConnection!.createAnswer();
    await this._peerConnection!.setLocalDescription(answer);

    // Update call document with answer
    const callDocRef = doc(db, "calls", this.callId);
    this.callDocRef = callDocRef;
    
    await updateDoc(callDocRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
      status: "active",
    });

    return answer;
  }

  // Handle remote answer (caller side)
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this._peerConnection!.currentRemoteDescription) {
      await this._peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  // Add ICE candidate to Firestore
  async addIceCandidate(candidate: RTCIceCandidate) {
    const candidateCollection = this.isCaller ? "callerCandidates" : "calleeCandidates";
    const candidatesRef = collection(db, "calls", this.callId, candidateCollection);
    
    await addDoc(candidatesRef, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      usernameFragment: candidate.usernameFragment,
    });
  }

  // Listen for remote ICE candidates
  listenForCandidates(onCandidate: (candidate: RTCIceCandidateInit) => void) {
    const candidateCollection = this.isCaller ? "calleeCandidates" : "callerCandidates";
    const candidatesRef = collection(db, "calls", this.callId, candidateCollection);
    const q = query(candidatesRef, orderBy("sdpMLineIndex"));

    this.unsubscribeCandidates = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as IceCandidate;
          onCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
          });
        }
      });
    });
  }

  // Listen for call updates
  listenForCallUpdates(
    onAnswer: (answer: RTCSessionDescriptionInit) => void,
    onCallEnded: () => void,
    onCallRejected: () => void
  ) {
    const callDocRef = doc(db, "calls", this.callId);
    this.callDocRef = callDocRef;

    this.unsubscribeCall = onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data() as CallData | undefined;
      if (!data) {
        onCallEnded();
        return;
      }

      if (data.status === "ended") {
        onCallEnded();
      } else if (data.status === "rejected") {
        onCallRejected();
      } else if (data.answer && this.isCaller) {
        onAnswer(data.answer);
      }
    });
  }

  // End call
  async endCall() {
    if (this.callDocRef) {
      await updateDoc(this.callDocRef, { status: "ended" });
    }
    this.cleanup();
  }

  // Reject call
  async rejectCall() {
    const callDocRef = doc(db, "calls", this.callId);
    await updateDoc(callDocRef, { status: "rejected" });
  }

  // Cleanup resources
  cleanup() {
    if (this.unsubscribeCall) {
      this.unsubscribeCall();
    }
    if (this.unsubscribeCandidates) {
      this.unsubscribeCandidates();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this._peerConnection) {
      this._peerConnection.close();
    }
    this.localStream = null;
    this.remoteStream = null;
    this._peerConnection = null;
  }

  // Delete call document (cleanup after call ends)
  async deleteCallDocument() {
    if (this.callDocRef) {
      // Delete subcollections first
      const callerCandidates = await getDocs(
        collection(db, "calls", this.callId, "callerCandidates")
      );
      const calleeCandidates = await getDocs(
        collection(db, "calls", this.callId, "calleeCandidates")
      );

      const deletePromises = [
        ...callerCandidates.docs.map((doc) => deleteDoc(doc.ref)),
        ...calleeCandidates.docs.map((doc) => deleteDoc(doc.ref)),
      ];
      await Promise.all(deletePromises);

      // Delete the call document
      await deleteDoc(this.callDocRef);
    }
  }
}

// Helper to generate unique call ID
export function generateCallId(callerId: string, calleeId: string): string {
  return `${callerId}_${calleeId}_${Date.now()}`;
}

// Listen for incoming calls
export function listenForIncomingCalls(
  userId: string,
  onIncomingCall: (callId: string, callData: CallData) => void
): () => void {
  const callsRef = collection(db, "calls");
  
  console.log('[WebRTC] Setting up listener for incoming calls to user:', userId);
  
  return onSnapshot(callsRef, (snapshot) => {
    console.log('[WebRTC] Snapshot received, changes:', snapshot.docChanges().length);
    
    snapshot.docChanges().forEach((change) => {
      console.log('[WebRTC] Doc change:', {
        type: change.type,
        id: change.doc.id,
        data: change.doc.data()
      });
      
      if (change.type === "added") {
        const data = change.doc.data() as CallData;
        console.log('[WebRTC] Checking call:', {
          calleeId: data.calleeId,
          userId: userId,
          status: data.status,
          match: data.calleeId === userId && data.status === "ringing"
        });
        
        // Check if this user is the callee and call is ringing
        if (data.calleeId === userId && data.status === "ringing") {
          console.log('[WebRTC] This is an incoming call for us!');
          onIncomingCall(change.doc.id, data);
        }
      }
    });
  }, (error) => {
    console.error('[WebRTC] Firestore listener error:', error);
  });
}
