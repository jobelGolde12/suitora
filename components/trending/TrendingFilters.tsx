"use client";

import { cn } from "@/lib/utils/cn";
import {
  CATEGORY_FILTER_PRIMARY,
  CATEGORY_FILTER_MORE,
  categoryConfig,
} from "@/config/category-display";

interface TrendingFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function TrendingFilters({
  activeCategory,
  onCategoryChange,
  className,
}: TrendingFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {CATEGORY_FILTER_PRIMARY.map((key) => {
        const label =
          key === "all" ? "All" : categoryConfig[key as keyof typeof categoryConfig]?.pluralLabel ?? key;
        const isActive = activeCategory === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onCategoryChange(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border bg-card text-muted hover:text-foreground hover:bg-surface"
            )}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}

      <label className="sr-only" htmlFor="trend-more-categories">
        More categories
      </label>
      <select
        id="trend-more-categories"
        value={CATEGORY_FILTER_MORE.includes(activeCategory as never) ? activeCategory : ""}
        onChange={(e) => {
          if (e.target.value) onCategoryChange(e.target.value);
        }}
        className={cn(
          "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          CATEGORY_FILTER_MORE.includes(activeCategory as never) &&
            "border-foreground/20 text-foreground"
        )}
      >
        <option value="">More…</option>
        {CATEGORY_FILTER_MORE.map((key) => (
          <option key={key} value={key}>
            {categoryConfig[key].pluralLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
