"use client";

import { SavedOpportunitiesProvider } from "@/context/SavedOpportunitiesContext";
import { CallProvider } from "@/context/CallContext";
import { ChatProvider } from "@/context/ChatContext";
import { EncryptionProvider } from "@/context/EncryptionContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AppSidebar } from "@/components/app-sidebar";
import { IncomingCallModal } from "@/components/IncomingCallModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <NotificationProvider>
        <EncryptionProvider>
          <ChatProvider>
            <CallProvider>
              <AppSidebar>{children}</AppSidebar>
              <IncomingCallModal />
            </CallProvider>
          </ChatProvider>
        </EncryptionProvider>
      </NotificationProvider>
    </SavedOpportunitiesProvider>
  );
}
