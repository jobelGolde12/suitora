"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TrendingCard } from "./TrendingCard";
import type { TrendItem } from "@/types/trend";
import { cn } from "@/lib/utils/cn";

interface TrendingCarouselProps {
  items: TrendItem[];
  className?: string;
}

export function TrendingCarousel({ items, className }: TrendingCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute -top-12 right-0 hidden sm:flex items-center gap-2">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted hover:text-foreground transition-colors"
          aria-label="Scroll trending items left"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted hover:text-foreground transition-colors"
          aria-label="Scroll trending items right"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="w-[min(70vw,240px)] shrink-0 snap-start"
          >
            <TrendingCard item={item} delay={i * 0.05} />
          </div>
        ))}
      </div>
    </div>
  );
}
