"use client";

import React, { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/animated-sidebar";
import {
  Briefcase,
  Building2,
  Heart,
  LayoutDashboard,
  User,
  FileText,
  BarChartHorizontal,
  Crown,
  Rocket,
  Kanban,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionalSearchBar } from "@/components/conditional-search-bar";
import { HeaderQuickActions } from "@/components/header-quick-actions";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const employeeLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: (
      <Briefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Applications",
    href: "/applications",
    icon: (
      <Kanban className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "LaunchPad",
    href: "/ai-tools",
    icon: (
      <Rocket className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Saved",
    href: "/saved",
    icon: (
      <Heart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <User className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
];

const employerLinks = [
  {
    label: "Dashboard",
    href: "/employer/dashboard",
    icon: (
      <Building2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Postings",
    href: "/employer/postings",
    icon: (
      <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Analytics",
    href: "/employer/analytics",
    icon: (
      <BarChartHorizontal className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
  {
    label: "Profile",
    href: "/employer/profile",
    icon: (
      <User className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    ),
  },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { role, user, loading } = useAuth();
  const pathname = usePathname();

  const links = role === "employer" ? employerLinks : employeeLinks;
  const dashboardHref = role === "employer" ? "/employer/dashboard" : "/dashboard";

  if (loading) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-[60px] bg-neutral-100 dark:bg-neutral-800 p-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="mt-8 flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-5" />
            ))}
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo href={dashboardHref} /> : <LogoIcon href={dashboardHref} />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={cn(
                    pathname === link.href && "bg-neutral-200 dark:bg-neutral-700 rounded-lg px-2"
                  )}
                />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden rounded-l-2xl bg-white dark:bg-neutral-900">
        <header className="sticky top-0 z-10 flex h-10 shrink-0 items-center justify-between gap-4 dark:border-neutral-700 px-4 sm:h-auto sm:px-6 py-2">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center max-w-xl">
            <ConditionalSearchBar />
          </div>
          <div className="flex-1 flex items-center justify-end gap-4">
            <HeaderQuickActions />
            <Link 
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent text-sm hover:from-amber-600 hover:to-yellow-600 transition-all border border-amber-600 dark:border-amber-600 rounded-full"
            >
              <span className="hidden sm:inline">Pricing</span>
            </Link>
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export const Logo = ({ href }: { href: string }) => {
  return (
    <Link
      href={href}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image
        src="https://i.postimg.cc/nLrDYrHW/icon.png"
        alt="CareerCompass logo"
        width={24}
        height={24}
        className="dark:bg-white dark:p-0.5 dark:rounded-md flex-shrink-0"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        CareerCompass
      </motion.span>
    </Link>
  );
};

export const LogoIcon = ({ href }: { href: string }) => {
  return (
    <Link
      href={href}
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <Image
        src="https://i.postimg.cc/nLrDYrHW/icon.png"
        alt="CareerCompass logo"
        width={24}
        height={24}
        className="dark:bg-white dark:p-0.5 dark:rounded-md flex-shrink-0"
      />
    </Link>
  );
};
