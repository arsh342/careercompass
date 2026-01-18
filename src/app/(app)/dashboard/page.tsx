"use client";
import { useAuth } from "@/context/AuthContext";
import { LumaSpin } from "@/components/ui/luma-spin";
import { Feed } from "@/components/ui/feed";

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Community Feed</h1>
        <p className="text-muted-foreground">
          Stay connected with the career community.
        </p>
      </div>

      <Feed />
    </div>
  );
}
