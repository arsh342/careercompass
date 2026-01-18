"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCall } from "@/context/CallContext";
import { 
  WebRTCSignaling, 
  generateCallId, 
  CallData 
} from "@/lib/webrtc-signaling";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Loader2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function VideoCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, userProfile } = useAuth();
  const { setIsInCall } = useCall();
  const { toast } = useToast();
  
  // State
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalingRef = useRef<WebRTCSignaling | null>(null);

  // Get params from URL
  const recipientId = searchParams.get("recipientId");
  const recipientName = searchParams.get("recipientName") || "Participant";
  const opportunityId = searchParams.get("opportunityId") || undefined;
  const opportunityTitle = searchParams.get("opportunityTitle") || "Video Call";
  const existingCallId = searchParams.get("callId");
  const isCallee = searchParams.get("isCallee") === "true";

  // Determine back link based on user role
  const isEmployer = userProfile?.role === "employer";
  const backLink = isEmployer ? "/employer/postings" : "/applications";

  // Request permissions explicitly
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Permission denied:", error);
      return false;
    }
  };

  // Initialize local media
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Media Error",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
      return null;
    }
  }, [isVideoOn, isAudioOn, toast]);

  // Handle remote stream
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (signalingRef.current) {
      await signalingRef.current.addIceCandidate(candidate);
    }
  }, []);

  // Handle connection state change
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    setConnectionState(state);
    if (state === "connected") {
      setCallStatus("connected");
      setIsCallActive(true);
      setIsConnecting(false);
      setIsInCall(true);
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (state === "disconnected" || state === "failed") {
      endCall();
    }
  }, [setIsInCall]);

  // Start call as caller
  const startCall = async () => {
    if (!user || !recipientId) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone access is required for video calls.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setCallStatus("calling");

    // Initialize media
    const stream = await initializeMedia();
    if (!stream) {
      setIsConnecting(false);
      return;
    }

    // Generate call ID
    const callId = generateCallId(user.uid, recipientId);
    
    // Create signaling instance
    const signaling = new WebRTCSignaling(callId, user.uid, true);
    signalingRef.current = signaling;

    // Initialize peer connection
    signaling.initializePeerConnection(
      handleRemoteStream,
      handleIceCandidate,
      handleConnectionStateChange
    );

    // Add local stream
    signaling.addLocalStream(stream);

    // Create and send offer
    await signaling.createCall(
      userProfile?.displayName || user.email || "Caller",
      recipientId,
      recipientName,
      opportunityId,
      opportunityTitle
    );

    // Listen for answer and updates
    signaling.listenForCallUpdates(
      async (answer) => {
        await signaling.handleAnswer(answer);
      },
      () => {
        toast({ title: "Call ended", description: "The other party ended the call." });
        endCall();
      },
      () => {
        toast({ title: "Call rejected", description: "The other party rejected your call." });
        endCall();
      }
    );

    // Listen for ICE candidates from callee
    signaling.listenForCandidates(async (candidateInit) => {
      try {
        await signaling.addRemoteIceCandidate(candidateInit);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });
  };

  // Answer call as callee
  const answerCall = useCallback(async () => {
    if (!user || !existingCallId) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      toast({
        title: "Permission Required",
        description: "Camera and microphone access is required for video calls.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setCallStatus("connecting");

    // Initialize media
    const stream = await initializeMedia();
    if (!stream) {
      setIsConnecting(false);
      return;
    }

    // Create signaling instance (as callee)
    const signaling = new WebRTCSignaling(existingCallId, user.uid, false);
    signalingRef.current = signaling;

    // Initialize peer connection
    signaling.initializePeerConnection(
      handleRemoteStream,
      handleIceCandidate,
      handleConnectionStateChange
    );

    // Add local stream
    signaling.addLocalStream(stream);

    // Get call data and answer
    const callDocRef = doc(db, "calls", existingCallId);
    const unsubscribe = onSnapshot(callDocRef, async (snapshot) => {
      const callData = snapshot.data() as CallData | undefined;
      if (callData?.offer && signaling.peerConnection && !signaling.peerConnection.currentRemoteDescription) {
        await signaling.answerCall(callData.offer);
        unsubscribe();
      }
    });

    // Listen for call updates
    signaling.listenForCallUpdates(
      () => {}, // No-op for callee (already answered)
      () => {
        toast({ title: "Call ended", description: "The other party ended the call." });
        endCall();
      },
      () => {}
    );

    // Listen for ICE candidates from caller
    signaling.listenForCandidates(async (candidateInit) => {
      try {
        await signaling.addRemoteIceCandidate(candidateInit);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });
  }, [user, existingCallId, initializeMedia, handleRemoteStream, handleIceCandidate, handleConnectionStateChange, toast]);

  // End call
  const endCall = useCallback(() => {
    if (signalingRef.current) {
      signalingRef.current.endCall();
      signalingRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    setIsCallActive(false);
    setIsConnecting(false);
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    setCallStatus("ended");
    setIsInCall(false);
    router.push(backLink);
  }, [localStream, backLink, router, setIsInCall]);

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-answer if joining as callee
  useEffect(() => {
    if (isCallee && existingCallId && user && !isConnecting && !isCallActive) {
      answerCall();
    }
  }, [isCallee, existingCallId, user, isConnecting, isCallActive, answerCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (signalingRef.current) {
        signalingRef.current.cleanup();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setIsInCall(false);
    };
  }, [localStream, setIsInCall]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backLink}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          {connectionState !== "new" && (
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              connectionState === "connected" ? "bg-emerald-500/20 text-emerald-500" :
              connectionState === "connecting" ? "bg-amber-500/20 text-amber-500" :
              "bg-muted text-muted-foreground"
            )}>
              {connectionState}
            </span>
          )}
          {isCallActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {formatDuration(callDuration)}
            </div>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {!isCallActive && !isConnecting ? (
          // Pre-call screen
          <Card className="p-8 text-center max-w-md w-full rounded-3xl">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-2xl">
                {recipientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold mb-1">{recipientName}</h2>
            <p className="text-muted-foreground text-sm mb-6">{opportunityTitle}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12",
                  !isVideoOn && "bg-red-500/20 border-red-500 text-red-500"
                )}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full w-12 h-12",
                  !isAudioOn && "bg-red-500/20 border-red-500 text-red-500"
                )}
                onClick={() => setIsAudioOn(!isAudioOn)}
              >
                {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </div>

            <Button 
              onClick={startCall}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8"
              size="lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Start Call
            </Button>
          </Card>
        ) : isConnecting ? (
          // Connecting screen
          <Card className="p-8 text-center max-w-md w-full rounded-3xl">
            <Avatar className="w-24 h-24 mx-auto mb-4 animate-pulse">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-2xl">
                {recipientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold mb-2">{recipientName}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {callStatus === "calling" ? "Calling..." : "Connecting..."}
            </div>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full mt-6"
              onClick={endCall}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </Card>
        ) : (
          // Active call screen
          <div className="w-full max-w-5xl relative">
            {/* Remote video (main) */}
            <Card className="aspect-video rounded-3xl overflow-hidden bg-muted flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-2xl">
                      {recipientName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-muted-foreground">
                    Waiting for {recipientName}...
                  </p>
                </div>
              )}
            </Card>

            {/* Local video (picture-in-picture) */}
            <Card className="absolute bottom-4 right-4 w-48 aspect-video rounded-2xl overflow-hidden bg-muted shadow-xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center mx-auto">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-white">
                You
              </div>
            </Card>
          </div>
        )}

        {/* Call Controls */}
        {isCallActive && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full w-14 h-14",
                !isVideoOn && "bg-red-500/20 border-red-500 text-red-500"
              )}
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full w-14 h-14",
                !isAudioOn && "bg-red-500/20 border-red-500 text-red-500"
              )}
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-14 h-14"
              onClick={endCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
