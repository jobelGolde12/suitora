"use client";

import { cn } from "@/lib/utils/cn";
import { getCategoryConfig, formatCategoryLabel } from "@/config/category-display";

interface CategoryBadgeProps {
  category: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function CategoryBadge({
  category,
  className,
  size = "sm",
  showIcon = true,
}: CategoryBadgeProps) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  const label = formatCategoryLabel(category);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/90 backdrop-blur-sm font-medium text-foreground",
        size === "sm" && "px-2 py-0.5 text-[10px] tracking-wide",
        size === "md" && "px-2.5 py-1 text-xs",
        className
      )}
      aria-label={`Category: ${label}`}
    >
      {showIcon && (
        <Icon
          className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
          strokeWidth={1.5}
          aria-hidden
        />
      )}
      <span>{label}</span>
    </span>
  );
}
