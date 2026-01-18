"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function EmployerProfileRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(`/users/${user.uid}`);
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
      <LumaSpin />
    </div>
  );
}
