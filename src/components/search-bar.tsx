
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/context/AuthContext';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (role === 'employer') return; 

    const currentPath = window.location.pathname;
    const targetPath = debouncedSearchTerm ? `/opportunities?q=${debouncedSearchTerm}` : '/opportunities';
    
    if (debouncedSearchTerm) {
        if (currentPath !== '/opportunities' || searchParams.get('q') !== debouncedSearchTerm) {
             router.push(targetPath);
        }
    } else if (currentPath === '/opportunities' && searchParams.has('q')) {
        router.push('/opportunities');
    }

  }, [debouncedSearchTerm, router, searchParams, role]);
  
  useEffect(() => {
    if (role === 'employer') return;
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams, role]);

  if (role === 'employer') {
    return null; // Don't render search bar or run its logic for employers
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search jobs..."
        className="w-full rounded-lg bg-background pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
