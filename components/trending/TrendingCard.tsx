"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { fadeInUp } from "@/components/dashboard/motion";
import { formatLocalPrice } from "@/lib/currency";
import type { TrendItem } from "@/types/trend";

interface TrendingCardProps {
  item: TrendItem;
  delay?: number;
  className?: string;
}

export function TrendingCard({ item, delay = 0, className }: TrendingCardProps) {
  const priceLabel = formatLocalPrice(item.price, item.currency);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
    >
      <Link
        href={`/trending/${item.id}`}
        className={cn(
          "group block overflow-hidden rounded-2xl border border-border bg-card shadow-card",
          "editorial-card-hover",
          className
        )}
      >
        <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-surface">
          {imageFailed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface text-muted">
              <ImageOff className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-light">
                Image unavailable
              </span>
            </div>
          ) : (
            <Image
              src={item.imageUrl}
              alt={`${item.title}${item.brand ? ` by ${item.brand}` : ""}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              onError={() => setImageFailed(true)}
            />
          )}
          <div className="absolute top-3 left-3">
            <CategoryBadge category={item.category} />
          </div>
          {item.isFeatured && (
            <div className="absolute top-3 right-3 rounded-full bg-background/90 border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide">
              Featured
            </div>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          {item.brand && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-light">
              {item.brand}
            </p>
          )}
          <h3 className="font-heading text-sm font-medium tracking-tight line-clamp-2">
            {item.title}
          </h3>
          <div className="flex items-center justify-between gap-2 pt-1">
            {priceLabel ? (
              <span className="text-sm tabular-nums text-foreground">{priceLabel}</span>
            ) : (
              <span className="text-xs text-muted font-light">View details</span>
            )}
            <span className="text-[10px] text-muted font-light tabular-nums">
              Trend {Math.round(item.popularityScore)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
