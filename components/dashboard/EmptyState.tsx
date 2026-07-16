import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-10 sm:p-14 shadow-card text-center",
        className
      )}
    >
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
        <Icon className="h-6 w-6 text-muted" strokeWidth={1.5} />
      </div>
      <p className="font-heading text-xl font-medium tracking-tight">{title}</p>
      <p className="text-sm text-muted font-light mt-2 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-8 flex justify-center">{action}</div>}
    </div>
  );
}
