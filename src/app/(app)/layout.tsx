import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { SearchBar } from '@/components/search-bar';
import { Suspense } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SavedOpportunitiesProvider } from '@/context/SavedOpportunitiesContext';
import Link from 'next/link';
import Image from 'next/image';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b">
            <Link href="/dashboard" className="flex items-center gap-2 p-2 group">
              <Image src="https://i.postimg.cc/nLrDYrHW/icon.png" alt="CareerCompass logo" width={32} height={32} className="dark:bg-white dark:p-1 dark:rounded-md group-hover:opacity-80 transition" />
              <span className="text-xl font-bold tracking-tight">CareerCompass</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-auto sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
              <Link href="/dashboard" className="flex items-center gap-2 text-primary">
                  <Image src="https://i.postimg.cc/nLrDYrHW/icon.png" alt="CareerCompass logo" width={24} height={24} className="dark:bg-white dark:p-1 dark:rounded-md" />
                  <span className="sr-only">CareerCompass</span>
              </Link>
            </div>
            <div className="flex-1">
              <Suspense fallback={<div className="h-9 w-full bg-muted rounded-md animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SavedOpportunitiesProvider>
  );
}
