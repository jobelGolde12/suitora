"use client";

import { SectionTitle } from "@/components/dashboard";
import { TrendingCarousel } from "./TrendingCarousel";
import { TrendingGrid } from "./TrendingGrid";
import { TrendingGridSkeleton } from "./TrendingCardSkeleton";
import type { TrendItem } from "@/types/trend";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

interface TrendingCollectionProps {
  title?: string;
  items: TrendItem[];
  isLoading?: boolean;
  layout?: "carousel" | "grid";
  href?: string;
  emptyMessage?: string;
  className?: string;
}

export function TrendingCollection({
  title = "Trending now",
  items,
  isLoading = false,
  layout = "carousel",
  href = "/trending",
  emptyMessage = "No trending items yet. Check back soon for curated fashion picks.",
  className,
}: TrendingCollectionProps) {
  return (
    <section className={cn("mb-12", className)}>
      <SectionTitle title={title} href={href} />

      {isLoading ? (
        <TrendingGridSkeleton count={layout === "carousel" ? 4 : 8} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface">
            <Sparkles className="h-5 w-5 text-muted" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted font-light max-w-md mx-auto leading-relaxed">
            {emptyMessage}
          </p>
          <Link href="/upload" className="inline-block mt-6">
            <Button variant="editorial" className="rounded-full px-6">
              Analyze an item
            </Button>
          </Link>
        </div>
      ) : layout === "carousel" ? (
        <TrendingCarousel items={items} />
      ) : (
        <TrendingGrid items={items} />
      )}
    </section>
  );
}
