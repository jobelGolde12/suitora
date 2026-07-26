"use client";

import { TrendingCard } from "./TrendingCard";
import type { TrendItem } from "@/types/trend";
import { cn } from "@/lib/utils/cn";

interface TrendingGridProps {
  items: TrendItem[];
  className?: string;
  startDelay?: number;
}

export function TrendingGrid({
  items,
  className,
  startDelay = 0,
}: TrendingGridProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {items.map((item, i) => (
        <TrendingCard key={item.id} item={item} delay={startDelay + i} />
      ))}
    </div>
  );
}
