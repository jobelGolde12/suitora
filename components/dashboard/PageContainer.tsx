import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Narrower content (forms, settings) */
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "mx-auto px-5 py-10 sm:px-8 lg:px-10 pb-24 md:pb-12",
          narrow ? "max-w-4xl" : "max-w-6xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
