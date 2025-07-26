
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
    if (role === 'employer') return; // Do not redirect for employers

    if (debouncedSearchTerm) {
      router.push(`/opportunities?q=${debouncedSearchTerm}`);
    } else if (debouncedSearchTerm === '' && searchParams.has('q')) {
        router.push('/opportunities');
    }
  }, [debouncedSearchTerm, router, searchParams, role]);
  
  useEffect(() => {
    // Keep search bar in sync with URL params
    if (role !== 'employer') {
        setSearchTerm(searchParams.get('q') || '');
    }
  }, [searchParams, role]);

  if (role === 'employer') {
    return null; // Don't render search bar for employers
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
