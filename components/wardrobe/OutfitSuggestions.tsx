"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import { getScoreColor } from "@/lib/utils/format";
import { OutfitItemStrip } from "@/components/outfits";
import type { TrendOutfit } from "@/types/trend";

interface SavedOutfit extends TrendOutfit {
  favoriteId: string;
}

interface OutfitSuggestionsProps {
  /** Number of items currently flagged as being in the user's wardrobe. */
  wardrobeCount: number;
}

/**
 * Editorial "Outfit Suggestions" section. Fetches complete, scored outfits
 * from the wardrobe, supports regenerate + save, and shows a saved strip.
 */
export function OutfitSuggestions({ wardrobeCount }: OutfitSuggestionsProps) {
  const { addToast } = useToast();
  const [outfits, setOutfits] = useState<TrendOutfit[]>([]);
  const [saved, setSaved] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(wardrobeCount > 0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (regenerate = false) => {
    if (wardrobeCount === 0) return;
    const url = regenerate
      ? "/api/wardrobe/outfits?regenerate=1"
      : "/api/wardrobe/outfits";
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load outfits");
    const data = await res.json();
    setOutfits(data?.outfits ?? []);
    setSaved(data?.saved ?? []);
  }, [wardrobeCount]);

  useEffect(() => {
    if (wardrobeCount === 0) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => load(false))
      .catch(() => {
        if (!cancelled) {
          setOutfits([]);
          setSaved([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wardrobeCount, load]);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      await load(true);
      addToast("Fresh outfit ideas ready", "success");
    } catch {
      addToast("Failed to regenerate outfits", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const isSaved = (outfitId: string) =>
    saved.some((s) => s.id === outfitId || s.favoriteId === outfitId);

  const handleToggleSave = async (outfit: TrendOutfit) => {
    const existing = saved.find((s) => s.id === outfit.id);
    setSavingId(outfit.id);
    try {
      if (existing) {
        const res = await fetch(
          `/api/wardrobe/outfits/favorite?id=${existing.favoriteId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to unsave");
        setSaved((prev) => prev.filter((s) => s.favoriteId !== existing.favoriteId));
        addToast("Removed saved outfit", "success");
      } else {
        const res = await fetch("/api/wardrobe/outfits/favorite", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outfit }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to save");
        setSaved((prev) => [data.favorite as SavedOutfit, ...prev]);
        addToast("Outfit saved", "success");
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setSavingId(null);
    }
  };

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

  if (outfits.length === 0 && saved.length === 0) return null;

  return (
    <div className="mb-10 space-y-8">
      {saved.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-medium tracking-tight">
            Saved outfits
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {saved.map((outfit) => (
              <div
                key={outfit.favoriteId}
                className="w-64 shrink-0 rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-heading text-sm font-medium line-clamp-2">
                    {outfit.name}
                  </p>
                  <span
                    className={cn(
                      "font-heading text-lg tabular-nums",
                      getScoreColor(outfit.overallScore)
                    )}
                  >
                    {outfit.overallScore}
                  </span>
                </div>
                <OutfitItemStrip items={outfit.items} />
              </div>
            ))}
          </div>
        </div>
      )}

      {outfits.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface">
                <Sparkles className="h-5 w-5 text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-medium tracking-tight">
                  Outfit Suggestions
                </h2>
                <p className="text-sm text-muted-foreground font-light">
                  Complete looks assembled from your wardrobe.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="rounded-full shrink-0"
              onClick={() => void handleRegenerate()}
              loading={isRegenerating}
              disabled={isRegenerating}
              aria-label="Regenerate outfit suggestions"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                saved={isSaved(outfit.id)}
                isSaving={savingId === outfit.id}
                onToggleSave={() => void handleToggleSave(outfit)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OutfitCard({
  outfit,
  saved,
  isSaving,
  onToggleSave,
}: {
  outfit: TrendOutfit;
  saved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
}) {
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={cn(
                "font-heading text-2xl font-medium tabular-nums leading-none",
                getScoreColor(outfit.overallScore)
              )}
            >
              {outfit.overallScore}
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-light">
              Outfit score
            </p>
            <button
              type="button"
              onClick={onToggleSave}
              disabled={isSaving}
              className={cn(
                "h-9 w-9 rounded-full border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                saved
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-muted hover:text-accent hover:border-accent"
              )}
              aria-label={saved ? "Unsave outfit" : "Save outfit"}
              aria-pressed={saved}
            >
              <Heart
                className={cn("h-4 w-4", saved && "fill-accent")}
                strokeWidth={1.5}
              />
            </button>
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
