"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted mb-6">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        <Button onClick={reset} variant="editorial" className="rounded-full">
          Try Again
        </Button>
      </div>
    </div>
  );
}
