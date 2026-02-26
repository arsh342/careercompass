"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { WebRTCCall, generateCallId, CallCallbacks } from "@/lib/webrtc-service";
import { useCall } from "@/context/CallContext";

type CallStatus = "idle" | "getting-media" | "calling" | "connecting" | "connected" | "ended";

export default function VideoCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { setIsInCall } = useCall();

  // Call state
  const [status, setStatus] = useState<CallStatus>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<WebRTCCall | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const isStartingCall = useRef(false);

  // URL params
  const recipientId = searchParams.get("recipientId");
  const recipientName = searchParams.get("recipientName") || "Participant";
  const opportunityId = searchParams.get("opportunityId") || undefined;
  const opportunityTitle = searchParams.get("opportunityTitle") || "Video Call";
  const existingCallId = searchParams.get("callId");
  const isCallee = searchParams.get("isCallee") === "true";

  // Navigation
  const isEmployer = userProfile?.role === "employer";
  const backLink = isEmployer ? "/employer/dashboard" : "/dashboard";

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    if (status === "connected") {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [status]);

  // Callbacks for WebRTC
  const callbacks: CallCallbacks = {
    onLocalStream: (stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    },
    onRemoteStream: (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },
    onConnectionStateChange: (state) => {
      if (state === "connected") {
        setStatus("connected");
        setIsInCall(true);
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (state === "failed") {
        toast({
          title: "Connection Failed",
          description: "Could not establish video connection.",
          variant: "destructive",
        });
        handleEndCall();
      }
    },
    onCallEnded: () => {
      toast({ title: "Call ended", description: "The call has ended." });
      handleEndCall();
    },
  };

  // End call
  const handleEndCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    if (callRef.current) {
      callRef.current.endCall();
      callRef.current = null;
    }
    setIsInCall(false);
    setStatus("ended");
    router.push(backLink);
  }, [router, backLink, setIsInCall]);

  // Start call (caller)
  const startCall = useCallback(async () => {
    if (!user || !recipientId || callRef.current || isStartingCall.current) return;
    isStartingCall.current = true;

    setStatus("getting-media");

    const callId = generateCallId(user.uid, recipientId);
    const call = new WebRTCCall(callId, user.uid, true, callbacks);

    const stream = await call.getMedia(isVideoOn, isAudioOn);
    if (!stream) {
      toast({
        title: "Media Error",
        description: "Could not access camera/microphone.",
        variant: "destructive",
      });
      call.cleanup();
      return;
    }

    callRef.current = call;
    setStatus("calling");

    try {
      await call.startCall(
        userProfile?.displayName || user.email || "Caller",
        recipientId,
        recipientName,
        opportunityId,
        opportunityTitle
      );
      setStatus("connecting");
    } catch (error) {
      console.error("[VideoCall] Error starting call:", error);
      toast({
        title: "Call Failed",
        description: "Could not start the call.",
        variant: "destructive",
      });
      handleEndCall();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recipientId, recipientName, opportunityId, opportunityTitle, isVideoOn, isAudioOn, userProfile]);

  // Answer call (callee)
  const answerCall = useCallback(async () => {
    if (!user || !existingCallId || callRef.current || isStartingCall.current) return;
    isStartingCall.current = true;

    setStatus("getting-media");

    const call = new WebRTCCall(existingCallId, user.uid, false, callbacks);

    const stream = await call.getMedia(isVideoOn, isAudioOn);
    if (!stream) {
      toast({
        title: "Media Error",
        description: "Could not access camera/microphone.",
        variant: "destructive",
      });
      call.cleanup();
      return;
    }

    callRef.current = call;
    setStatus("connecting");

    try {
      await call.answerCall();
    } catch (error) {
      console.error("[VideoCall] Error answering call:", error);
      toast({
        title: "Call Failed",
        description: "Could not answer the call.",
        variant: "destructive",
      });
      handleEndCall();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, existingCallId, isVideoOn, isAudioOn]);

  // Initialize call on mount
  useEffect(() => {
    if (hasInitialized.current || callRef.current || !user) return;
    hasInitialized.current = true;

    if (isCallee && existingCallId) {
      answerCall();
    } else if (recipientId) {
      startCall();
    }
  }, [user, isCallee, existingCallId, recipientId, answerCall, startCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.cleanup();
        callRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  // Video element srcObject sync
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Toggle handlers
  const toggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    callRef.current?.toggleVideo(newState);
    resetControlsTimer();
  };

  const toggleAudio = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    callRef.current?.toggleAudio(newState);
    resetControlsTimer();
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case "getting-media": return "Getting camera...";
      case "calling": return "Calling...";
      case "connecting": return "Connecting...";
      case "connected": return "Connected";
      case "ended": return "Call ended";
      default: return "";
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
    >
      {/* Remote video (fullscreen background) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* No video placeholder */}
      {!remoteStream && status === "connected" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Avatar className="h-32 w-32">
            <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-primary/60">
              {recipientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-24 right-4 w-28 sm:w-36 md:w-44 aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isVideoOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
          You
        </span>
      </div>

      {/* Top controls bar - overlaid with blur */}
      <div className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${
        showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}>
        <div className="flex items-center justify-between p-4 ">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={handleEndCall}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          {/* Status and timer */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              status === "connected" 
                ? "bg-green-500/30 text-green-400" 
                : "bg-yellow-500/30 text-yellow-400"
            }`}>
              {status !== "connected" && <Loader2 className="h-3 w-3 animate-spin" />}
              {status === "connected" && <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
              {getStatusText()}
            </div>
            {status === "connected" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/30 text-red-400 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                {formatDuration(callDuration)}
              </div>
            )}
          </div>

          {/* Recipient name */}
          <div className="flex items-center gap-2 text-white">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-primary/60">
                {recipientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium hidden sm:inline">{recipientName}</span>
          </div>
        </div>
      </div>

      {/* Bottom controls bar - overlaid with blur */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
      }`}>
        <div className="flex items-center justify-center gap-4 p-6">
          {/* Video toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full transition-all ${
              isVideoOn 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-red-500/80 hover:bg-red-500 text-white"
            }`}
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          {/* Audio toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full transition-all ${
              isAudioOn 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-red-500/80 hover:bg-red-500 text-white"
            }`}
            onClick={toggleAudio}
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* End call */}
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Connecting overlay */}
      {status !== "connected" && status !== "ended" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20">
            <Avatar className="h-24 w-24 ring-4 ring-white/20">
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60">
                {recipientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">{recipientName}</h2>
              <div className="flex items-center justify-center gap-2 text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{getStatusText()}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleEndCall}
              className="mt-2 bg-red-500/80 hover:bg-red-500 text-white px-6"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
