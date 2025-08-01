"use client";

import {
  Briefcase,
  Building2,
  Heart,
  LayoutDashboard,
  User,
  FileText,
  BarChartHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const employeeLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: Briefcase,
  },
  {
    href: "/applied",
    label: "Applied",
    icon: FileText,
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Heart,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

const employerLinks = [
  {
    href: "/employer/dashboard",
    label: "Dashboard",
    icon: Building2,
  },
  {
    href: "/employer/postings",
    label: "Postings",
    icon: FileText,
  },
  {
    href: "/employer/analytics",
    label: "Analytics",
    icon: BarChartHorizontal,
  },
  {
    href: "/employer/profile",
    label: "Profile",
    icon: User,
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const links = role === "employer" ? employerLinks : employeeLinks;

  return (
    <div className="flex flex-col h-full p-1">
      <SidebarMenu className="flex-1">
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref>
              <SidebarMenuButton
                isActive={pathname === link.href}
                className="w-full"
                asChild
              >
                <span className="text-[16px] font-bold flex items-center gap-2">
                  <link.icon className="h-8 w-8" />
                  {link.label}
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
