"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getCategoryCropClass } from "@/config/category-display";

interface CategoryHeroImageProps {
  category?: string | null;
  imageUrl: string;
  alt?: string;
  badges?: string[];
  className?: string;
  priority?: boolean;
}

export function CategoryHeroImage({
  category,
  imageUrl,
  alt = "Clothing item",
  badges = [],
  className,
  priority = false,
}: CategoryHeroImageProps) {
  const cropClass = getCategoryCropClass(category);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
        cropClass,
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        unoptimized
        priority={priority}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent p-4 pt-12">
        <div className="flex flex-wrap gap-2">
          {category && <CategoryBadge category={category} size="md" />}
          {badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-full border border-border/80 bg-background/90 px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
