import { CompassIcon } from '@/components/icons';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SavedOpportunitiesProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 p-1">
              <CompassIcon className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight">CareerCompass</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
              <Link href="/dashboard" className="flex items-center gap-2 text-primary">
                  <CompassIcon className="h-6 w-6" />
                  <span className="text-lg font-bold tracking-tight">CareerCompass</span>
              </Link>
            </div>
            <div className="flex-1">
              {/* Can add breadcrumbs or page title here */}
            </div>
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SavedOpportunitiesProvider>
  );
}
