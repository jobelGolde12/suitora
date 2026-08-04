"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { getScoreColor } from "@/lib/utils/format";
import { OutfitItemStrip } from "@/components/outfits";
import type { TrendOutfit } from "@/types/trend";

interface OutfitSuggestionsProps {
  /** Number of items currently flagged as being in the user's wardrobe. */
  wardrobeCount: number;
}

/**
 * Editorial "Outfit Suggestions" section for the favorites page. Fetches
 * complete, scored outfits assembled from the user's wardrobe and displays
 * them with per-item strips, quality dimensions, and styling tips.
 */
export function OutfitSuggestions({ wardrobeCount }: OutfitSuggestionsProps) {
  const [outfits, setOutfits] = useState<TrendOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(wardrobeCount > 0);

  useEffect(() => {
    if (wardrobeCount === 0) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => fetch("/api/wardrobe/outfits", { credentials: "include" }))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setOutfits(data?.outfits ?? []);
      })
      .catch(() => {
        if (!cancelled) setOutfits([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wardrobeCount]);

  if (wardrobeCount === 0) return null;

  if (isLoading) {
    return (
      <div className="mb-10 space-y-4">
        <div className="h-6 w-52 animate-pulse rounded bg-surface" />
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  if (outfits.length === 0) return null;

  return (
    <div className="mb-10 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface">
          <Sparkles className="h-5 w-5 text-accent" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-heading text-lg font-medium tracking-tight">
            Outfit Suggestions
          </h2>
          <p className="text-sm text-muted-foreground font-light">
            Complete looks assembled from your wardrobe, scored against your
            profile.
          </p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {outfits.map((outfit) => (
          <OutfitCard key={outfit.id} outfit={outfit} />
        ))}
      </div>
    </div>
  );
}

function OutfitCard({ outfit }: { outfit: TrendOutfit }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-base font-medium tracking-tight">
              {outfit.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {outfit.occasionTags.map((tag) => (
                <Badge key={tag} variant="accent" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span
              className={cn(
                "font-heading text-2xl font-medium tabular-nums leading-none",
                getScoreColor(outfit.overallScore)
              )}
            >
              {outfit.overallScore}
            </span>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted font-light">
              Outfit score
            </p>
          </div>
        </div>

        <OutfitItemStrip items={outfit.items} />

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted font-light">
          <span>
            Coherence{" "}
            <b className="font-medium text-foreground tabular-nums">
              {outfit.coherenceScore}
            </b>
          </span>
          <span>
            Color{" "}
            <b className="font-medium text-foreground tabular-nums">
              {outfit.colorStoryScore}
            </b>
          </span>
          <span>
            Proportion{" "}
            <b className="font-medium text-foreground tabular-nums">
              {outfit.proportionScore}
            </b>
          </span>
        </div>

        {outfit.stylingTips.length > 0 && (
          <ul className="space-y-1.5 border-t border-border pt-3">
            {outfit.stylingTips.map((tip) => (
              <li
                key={tip}
                className="flex gap-2 text-xs text-muted-foreground font-light"
              >
                <Sparkles
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                  strokeWidth={1.5}
                />
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
