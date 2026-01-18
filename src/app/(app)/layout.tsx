"use client";

import { SavedOpportunitiesProvider } from "@/context/SavedOpportunitiesContext";
import { CallProvider } from "@/context/CallContext";
import { AppSidebar } from "@/components/app-sidebar";
import { IncomingCallModal } from "@/components/IncomingCallModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <CallProvider>
        <AppSidebar>{children}</AppSidebar>
        <IncomingCallModal />
      </CallProvider>
    </SavedOpportunitiesProvider>
  );
}
