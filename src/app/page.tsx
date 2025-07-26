'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// For the purpose of this example, we will use a mock auth check.
// In a real application, you would integrate with Firebase Auth.
const useAuth = () => {
  // Mocking auth state. In a real app, this would check Firebase Auth state.
  // We'll default to unauthenticated to show the login flow.
  const isAuthenticated = false; 
  const isLoading = false;
  
  return { isAuthenticated, isLoading };
};

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
        if (!isLoading) {
        if (isAuthenticated) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
        }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="h-12 w-12 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-muted-foreground">Loading CareerCompass...</p>
      </div>
    </div>
  );
}
