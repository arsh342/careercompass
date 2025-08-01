"use client";

import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { SearchBar } from "@/components/search-bar";

export function ConditionalSearchBar() {
  const { role, loading } = useAuth();

  // Don't render anything during loading or for employers
  if (loading || role === "employer") {
    return null;
  }

  // Only render SearchBar for employees with Suspense wrapper
  return (
    <Suspense
      fallback={
        <div className="h-9 w-full bg-muted rounded-md animate-pulse" />
      }
    >
      <SearchBar />
    </Suspense>
  );
}
