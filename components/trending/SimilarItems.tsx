"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatLocalPrice } from "@/lib/currency";
import type { SimilarItemResult } from "@/types";

interface SimilarItemsProps {
  analysisId: string;
}

export function SimilarItems({ analysisId }: SimilarItemsProps) {
  const [items, setItems] = useState<SimilarItemResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trending/similar?analysisId=${encodeURIComponent(analysisId)}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItems(data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-lg font-medium tracking-tight">
          Items Like This
        </h2>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Complementary pieces scored against your profile.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <SimilarItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function SimilarItemCard({ item }: { item: SimilarItemResult }) {
  const [imageFailed, setImageFailed] = useState(false);
  const priceLabel = formatLocalPrice(item.price, item.currency);

  return (
    <Link
      href={`/trending/${item.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card editorial-card-hover"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {imageFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface text-muted">
            <ImageOff className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-light">
              Image unavailable
            </span>
          </div>
        ) : (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="absolute top-2 left-2">
          <CategoryBadge category={item.category} />
        </div>
        <div className="absolute bottom-2 right-2 rounded-full bg-background/90 border border-border px-2 py-0.5 text-[10px] font-medium tabular-nums">
          {item.scoreLabel}
        </div>
      </div>
      <div className="p-3 space-y-1">
        {item.brand && (
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted font-light truncate">
            {item.brand}
          </p>
        )}
        <h3 className="font-heading text-xs font-medium tracking-tight line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {priceLabel ? (
            <span className="text-xs tabular-nums text-foreground">{priceLabel}</span>
          ) : (
            <span className="text-[10px] text-muted font-light">View details</span>
          )}
          <span className="text-[10px] text-muted font-light tabular-nums">
            {Math.round(item.score)}/100
          </span>
        </div>
      </div>
    </Link>
  );
}
