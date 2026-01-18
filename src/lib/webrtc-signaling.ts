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
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
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
    const callDocRef = doc(db, "calls", this.callId);
    this.callDocRef = callDocRef;

    // Create offer
    const offer = await this._peerConnection!.createOffer();
    await this._peerConnection!.setLocalDescription(offer);

    // Save call data to Firestore
    const callData: CallData = {
      callerId: this.userId,
      callerName,
      calleeId,
      calleeName,
      opportunityId,
      opportunityTitle,
      status: "ringing",
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(callDocRef, callData);
    return offer;
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
  
  return onSnapshot(callsRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data() as CallData;
        // Check if this user is the callee and call is ringing
        if (data.calleeId === userId && data.status === "ringing") {
          onIncomingCall(change.doc.id, data);
        }
      }
    });
  });
}
