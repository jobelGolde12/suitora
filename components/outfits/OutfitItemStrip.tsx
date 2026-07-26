"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getScoreColor, formatScore } from "@/lib/utils/format";
import type { TrendOutfitItem } from "@/types/trend";

interface OutfitItemStripProps {
  items: TrendOutfitItem[];
  className?: string;
}

export function OutfitItemStrip({ items, className }: OutfitItemStripProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-1",
        className
      )}
      style={{ scrollbarWidth: "none" }}
      role="list"
      aria-label="Outfit items"
    >
      {items.map((item, i) => (
        <div
          key={`${item.itemName}-${i}`}
          role="listitem"
          className="w-36 shrink-0 rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="relative aspect-square bg-surface">
            <Image
              src={item.itemImageUrl}
              alt={item.itemName}
              fill
              sizes="144px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-2.5 space-y-1">
            <p className="text-xs font-medium truncate">{item.itemName}</p>
            <div className="flex items-center justify-between gap-1">
              <CategoryBadge category={String(item.category)} size="sm" />
              <span
                className={cn(
                  "text-[10px] tabular-nums font-medium",
                  getScoreColor(item.individualScore)
                )}
              >
                {formatScore(item.individualScore)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
