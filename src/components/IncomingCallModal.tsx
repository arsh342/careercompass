"use client";

import { useCall } from "@/context/CallContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const { callData } = incomingCall;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
        >
          {/* Caller Avatar */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto relative">
              <Avatar className="w-24 h-24 animate-pulse">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-500 text-3xl">
                  {callData.callerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" />
            </div>
          </div>

          {/* Caller Info */}
          <h2 className="text-xl font-semibold text-foreground mb-1">
            {callData.callerName}
          </h2>
          <p className="text-muted-foreground text-sm mb-2">
            Incoming video call
          </p>
          {callData.opportunityTitle && (
            <p className="text-xs text-muted-foreground mb-6">
              Re: {callData.opportunityTitle}
            </p>
          )}

          {/* Video icon indicator */}
          <div className="flex items-center justify-center gap-2 text-emerald-500 mb-8">
            <Video className="h-5 w-5" />
            <span className="text-sm">Video Call</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Reject */}
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={rejectCall}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>

            {/* Accept */}
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-emerald-600 hover:bg-emerald-700"
              onClick={acceptCall}
            >
              <Phone className="h-7 w-7" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
