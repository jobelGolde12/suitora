"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Shirt, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  fadeInUp,
} from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { Analysis } from "@/types";

export default function FavoritesPage() {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<(Analysis & { isFavorite: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/analysis");
      if (res.ok) {
        const data = await res.json();
        const allAnalyses = data.analyses || [];
        // Filter to only favorited analyses
        const favorited = allAnalyses.filter((a: Analysis & { isFavorite: boolean }) => a.isFavorite);
        setFavorites(favorited);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
      addToast("Failed to load favorites", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/favorites?analysisId=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        addToast("Removed from favorites", "success");
      } else {
        throw new Error("Failed to remove favorite");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to remove favorite", "error");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted font-light">Loading favorites...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        label="Saved"
        title="Favorites"
        description={`Analyses you've saved for later (${favorites.length} items).`}
        action={
          <Link href="/history">
            <Button variant="editorial" className="rounded-full px-6">
              Browse History
            </Button>
          </Link>
        }
      />

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Save analyses you love to find them here later."
          action={
            <Link href="/history">
              <Button variant="editorial" className="rounded-full px-6">
                Browse History
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((analysis, i) => (
            <motion.div
              key={analysis.id}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={i}
              className="group rounded-2xl border border-border bg-card shadow-card editorial-card-hover overflow-hidden"
            >
              <div className="h-36 bg-surface relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="h-10 w-10 text-muted/40" strokeWidth={1.25} />
                </div>
                <div className="absolute top-3 left-3">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center border border-border bg-card shadow-soft",
                      getScoreColor(analysis.overallScore)
                    )}
                  >
                    <span className="font-heading text-sm font-medium tabular-nums">
                      {formatScore(analysis.overallScore)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(analysis.id);
                  }}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Remove from favorites"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <Link href={`/results/${analysis.id}`}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={analysis.overallScore >= 70 ? "success" : "warning"}>
                      {analysis.overallScore >= 70 ? "Good Match" : "Average"}
                    </Badge>
                    <Heart className="h-3 w-3 text-accent fill-accent" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted font-light">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" strokeWidth={1.5} />
                      Body {formatScore(analysis.bodyScore ?? 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" strokeWidth={1.5} />
                      Style {formatScore(analysis.styleScore ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2.5 font-light">
                    {formatRelativeTime(analysis.createdAt)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
