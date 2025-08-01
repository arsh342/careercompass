import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { ConditionalSearchBar } from "@/components/conditional-search-bar";
import { HeaderQuickActions } from "@/components/header-quick-actions";
import { Suspense } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SavedOpportunitiesProvider } from "@/context/SavedOpportunitiesContext";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import ClientSidebarHeader from "@/components/client-sidebar-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b">
            <ClientSidebarHeader />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-auto sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
              <ClientSidebarHeader />
            </div>
            <div className="flex-1">
              <ConditionalSearchBar />
            </div>
            <HeaderQuickActions />
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SavedOpportunitiesProvider>
  );
}
