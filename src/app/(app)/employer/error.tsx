"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Employer Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <CardTitle className="text-xl">Employer Portal Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Something went wrong in the employer portal. Please try again or
            return to the dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={reset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild>
              <Link href="/employer/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Employer Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
