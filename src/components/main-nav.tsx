
'use client';

import {
  Briefcase,
  Building2,
  Heart,
  LayoutDashboard,
  User,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const employeeLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    icon: Briefcase,
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: Heart,
  },
];

const employerLinks = [
    {
      href: '/employer/dashboard',
      label: 'Dashboard',
      icon: Building2,
    },
    {
      href: '/employer/postings',
      label: 'Postings',
      icon: FileText,
    },
]

export function MainNav() {
  const pathname = usePathname();
  const { role, loading } = useAuth();

  if (loading) {
      return (
          <div className="flex flex-col gap-4 p-2">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
          </div>
      )
  }

  const links = role === 'employer' ? employerLinks : employeeLinks;
  const title = role === 'employer' ? 'For Employers' : 'My Compass';

  return (
    <div className="flex flex-col gap-4">
      <SidebarMenu>
        <p className="px-2 text-xs font-semibold text-muted-foreground">{title}</p>
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref>
              <SidebarMenuButton
                isActive={pathname === link.href}
                className="w-full"
                asChild
              >
                <span>
                  <link.icon className="h-4 w-4" />
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
