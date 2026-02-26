"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AIToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AI Tools Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <Bot className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <CardTitle className="text-xl">AI Tool Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            The AI service encountered an issue. This could be due to temporary
            API overload. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={reset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button asChild>
              <Link href="/ai-tools">
                <ArrowLeft className="mr-2 h-4 w-4" />
                AI Tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
