
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      router.push(`/opportunities?q=${debouncedSearchTerm}`);
    } else if (debouncedSearchTerm === '' && searchParams.has('q')) {
        router.push('/opportunities');
    }
  }, [debouncedSearchTerm, router, searchParams]);
  
  useEffect(() => {
    // Keep search bar in sync with URL params
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

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
