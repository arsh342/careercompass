"use client";

import { CallProvider } from "@/context/CallContext";
import { EncryptionProvider } from "@/context/EncryptionContext";

// Minimal layout for video call - no sidebar, fullscreen
export default function VideoCallLayout({ children }: { children: React.ReactNode }) {
  return (
    <EncryptionProvider>
      <CallProvider>
        <div className="fixed inset-0 bg-black">
          {children}
        </div>
      </CallProvider>
    </EncryptionProvider>
  );
}
