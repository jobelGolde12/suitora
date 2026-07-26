"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "@/components/dashboard/motion";
import { getScoreColor, formatScore } from "@/lib/utils/format";
import type { TrendOutfit } from "@/types/trend";

interface TrendOutfitCardProps {
  outfit: TrendOutfit;
  href?: string;
  delay?: number;
  className?: string;
}

export function TrendOutfitCard({
  outfit,
  href,
  delay = 0,
  className,
}: TrendOutfitCardProps) {
  const imageUrl =
    outfit.generatedImageUrl || outfit.items[0]?.itemImageUrl || "";
  const content = (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
      className={cn(
        "group rounded-2xl border border-border overflow-hidden bg-card shadow-card",
        "transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5",
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={outfit.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur-sm">
          <span
            className={cn(
              "font-heading text-sm font-medium tabular-nums",
              getScoreColor(outfit.overallScore)
            )}
            aria-label={`Outfit score: ${outfit.overallScore} out of 100`}
          >
            {formatScore(outfit.overallScore).replace("%", "")}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-heading text-base font-medium tracking-tight">
          {outfit.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {outfit.items.map((item, i) => (
            <Badge key={`${item.role}-${i}`} variant="default" className="text-[10px]">
              {item.role}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-muted font-light">
          <span>{outfit.items.length} items</span>
          <span aria-hidden>·</span>
          <span>Coherence {outfit.coherenceScore}</span>
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
