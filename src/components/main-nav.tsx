'use client';

import {
  Briefcase,
  Building2,
  Heart,
  LayoutDashboard,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const links = [
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
      label: 'Employer Dashboard',
      icon: Building2,
    },
]

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref>
              <SidebarMenuButton
                isActive={pathname.startsWith(link.href)}
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
      <SidebarMenu>
        <p className="px-2 text-xs font-semibold text-muted-foreground">For Employers</p>
         {employerLinks.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref>
              <SidebarMenuButton
                isActive={pathname.startsWith(link.href)}
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
