import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface SectionTitleProps {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  action?: ReactNode;
}

export function SectionTitle({
  title,
  href,
  linkLabel = "View all",
  className,
  action,
}: SectionTitleProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 mb-5", className)}>
      <h2 className="font-heading text-xl font-medium tracking-tight">{title}</h2>
      {action}
      {!action && href && (
        <Link
          href={href}
          className="text-xs text-muted hover:text-foreground transition-colors duration-200"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
