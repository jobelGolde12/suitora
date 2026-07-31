"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Shirt, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useToast } from "@/components/ui/Toast";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  fadeInUp,
  FavoritesSkeleton,
} from "@/components/dashboard";
import { TrendingFilters } from "@/components/trending";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { Analysis } from "@/types";

type FavoriteAnalysis = Analysis & {
  isFavorite: boolean;
  category?: string | null;
  compatibilityMetadata?: string | null;
};

function extractCategory(analysis: FavoriteAnalysis): string | null {
  if (analysis.category) return analysis.category;
  if (!analysis.compatibilityMetadata) return null;
  try {
    const meta =
      typeof analysis.compatibilityMetadata === "string"
        ? JSON.parse(analysis.compatibilityMetadata)
        : analysis.compatibilityMetadata;
    return meta?.itemProfile?.category ?? null;
  } catch {
    return null;
  }
}

export default function FavoritesPage() {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const favorited = (data.favorites || []).map((fav: any) => ({
          ...fav.analysis,
          isFavorite: true,
          category: extractCategory(fav.analysis),
        }));
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

  const filteredFavorites = useMemo(() => {
    if (activeCategory === "all") return favorites;
    return favorites.filter((f) => f.category === activeCategory);
  }, [favorites, activeCategory]);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/favorites?analysisId=${id}`, {
        method: "DELETE",
        credentials: "include",
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
    return <FavoritesSkeleton />;
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

      {favorites.length > 0 && (
        <div className="mb-8">
          <TrendingFilters
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      )}

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
      ) : filteredFavorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites in this category"
          description="Try another category filter or save more analyses that match."
          action={
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => setActiveCategory("all")}
            >
              Show all
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFavorites.map((analysis, i) => (
            <motion.div
              key={analysis.id}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={i}
              className="group rounded-2xl border border-border bg-card shadow-card editorial-card-hover overflow-hidden"
            >
              <div className="aspect-[4/5] bg-surface relative overflow-hidden">
                {analysis.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={analysis.productImage}
                    alt="Saved item"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="h-10 w-10 text-muted/40" strokeWidth={1.25} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center border border-border bg-card/90 backdrop-blur-sm shadow-soft",
                      getScoreColor(analysis.overallScore)
                    )}
                  >
                    <span className="font-heading text-sm font-medium tabular-nums">
                      {formatScore(analysis.overallScore)}
                    </span>
                  </div>
                </div>
                {analysis.category && (
                  <div className="absolute bottom-3 left-3">
                    <CategoryBadge category={analysis.category} />
                  </div>
                )}
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
