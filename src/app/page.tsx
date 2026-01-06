
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LumaSpin } from '@/components/ui/luma-spin';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      if (!loading) {
        if (user) {
          if (role === 'employer') {
            router.push('/employer/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, loading, role, router, pathname]);

  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LumaSpin />
        <p className="text-muted-foreground">Loading CareerCompass...</p>
      </div>
    </div>
  );
}
