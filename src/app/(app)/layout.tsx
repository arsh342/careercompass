"use client";

import { SavedOpportunitiesProvider } from "@/context/SavedOpportunitiesContext";
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <AppSidebar>{children}</AppSidebar>
    </SavedOpportunitiesProvider>
  );
}
