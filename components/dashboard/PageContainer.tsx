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
          "mx-auto px-5 pt-24 pb-28 sm:px-8 md:pt-10 lg:px-10 md:pb-12",
          narrow ? "max-w-4xl" : "max-w-6xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
