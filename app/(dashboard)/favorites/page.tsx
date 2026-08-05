"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Pencil, Shirt, Trash2, BarChart3 } from "lucide-react";
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
import { OutfitSuggestions } from "@/components/wardrobe/OutfitSuggestions";
import {
  ItemFolderModal,
  type WardrobeFolderOption,
} from "@/components/wardrobe/ItemFolderModal";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { AnalysisResult, FavoriteItem } from "@/types";

type FavoriteAnalysis = AnalysisResult & {
  isFavorite: boolean;
  category?: string | null;
  inWardrobe: boolean;
  wardrobeTags: string[];
  wardrobeFolder?: string | null;
  wardrobeFolderName?: string | null;
};

function extractCategory(analysis: AnalysisResult): string | null {
  if (!analysis.compatibilityMetadata) return null;
  try {
    const meta = analysis.compatibilityMetadata as {
      itemProfile?: { category?: string };
    } | null;
    return meta?.itemProfile?.category ?? null;
  } catch {
    return null;
  }
}

export default function FavoritesPage() {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteAnalysis[]>([]);
  const [folders, setFolders] = useState<WardrobeFolderOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [view, setView] = useState<"all" | "wardrobe">("all");
  const [editing, setEditing] = useState<FavoriteAnalysis | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/favorites", { credentials: "include" }),
      fetch("/api/wardrobe/folders", { credentials: "include" }),
    ])
      .then(async ([favRes, folderRes]) => {
        const favData = favRes.ok ? await favRes.json() : null;
        const folderData = folderRes.ok ? await folderRes.json() : null;
        const folderList = (folderData?.folders ?? []) as WardrobeFolderOption[];
        setFolders(folderList);
        const nameById = new Map(folderList.map((f) => [f.id, f.name]));

        const favorited = ((favData?.favorites ?? []) as FavoriteItem[]).map(
          (fav) => ({
            ...fav.analysis,
            isFavorite: true,
            category: extractCategory(fav.analysis),
            inWardrobe: fav.inWardrobe,
            wardrobeTags: fav.wardrobeTags,
            wardrobeFolder: fav.wardrobeFolder,
            wardrobeFolderName: fav.wardrobeFolder
              ? (nameById.get(fav.wardrobeFolder) ?? null)
              : null,
          })
        );
        setFavorites(favorited);
      })
      .catch((err) => {
        console.error("Failed to load favorites:", err);
        addToast("Failed to load favorites", "error");
      })
      .finally(() => setIsLoading(false));
  }, [addToast]);

  const filteredFavorites = useMemo(() => {
    return favorites.filter((f) => {
      const matchesCategory =
        activeCategory === "all" || f.category === activeCategory;
      const matchesView = view === "all" || f.inWardrobe;
      return matchesCategory && matchesView;
    });
  }, [favorites, activeCategory, view]);

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

  const handleToggleWardrobe = async (analysis: FavoriteAnalysis) => {
    if (!analysis.inWardrobe) {
      setEditing(analysis);
      return;
    }

    const next = false;
    setFavorites((prev) =>
      prev.map((f) =>
        f.id === analysis.id
          ? {
              ...f,
              inWardrobe: next,
              wardrobeFolder: null,
              wardrobeFolderName: null,
            }
          : f
      )
    );
    try {
      const res = await fetch("/api/favorites", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          inWardrobe: next,
          wardrobeFolder: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update wardrobe");
      addToast("Removed from wardrobe", "success");
    } catch (err) {
      console.error(err);
      setFavorites((prev) =>
        prev.map((f) =>
          f.id === analysis.id
            ? {
                ...f,
                inWardrobe: true,
                wardrobeFolder: analysis.wardrobeFolder,
                wardrobeFolderName: analysis.wardrobeFolderName,
              }
            : f
        )
      );
      addToast("Failed to update wardrobe", "error");
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
          <div className="flex flex-wrap gap-2">
            <Link href="/wardrobe">
              <Button variant="secondary" className="rounded-full px-6">
                Wardrobe
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="editorial" className="rounded-full px-6">
                Browse History
              </Button>
            </Link>
          </div>
        }
      />

      <OutfitSuggestions
        wardrobeCount={favorites.filter((f) => f.inWardrobe).length}
      />

      {favorites.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "wardrobe", label: "In Wardrobe" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setView(opt.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    view === opt.value
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
          icon={view === "wardrobe" ? Shirt : Heart}
          title={
            view === "wardrobe" ? "Wardrobe is empty" : "No favorites in this category"
          }
          description={
            view === "wardrobe"
              ? "Toggle the wardrobe icon on a saved item to keep it organized here."
              : "Try another category filter or save more analyses that match."
          }
          action={
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => {
                setActiveCategory("all");
                setView("all");
              }}
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
                {analysis.inWardrobe && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(analysis);
                    }}
                    className="absolute bottom-3 right-3 rounded-full bg-accent/90 text-background border border-accent px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Edit wardrobe folder and tags"
                  >
                    In Wardrobe
                  </button>
                )}
                {analysis.inWardrobe && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(analysis);
                    }}
                    className="absolute top-3 right-[6.5rem] h-9 w-9 rounded-full border border-border bg-card/90 text-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/10 hover:text-accent"
                    aria-label="Edit folder and tags"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleToggleWardrobe(analysis);
                  }}
                  className={cn(
                    "absolute top-3 right-14 h-9 w-9 rounded-full border bg-card/90 text-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    analysis.inWardrobe
                      ? "border-accent text-accent"
                      : "border-border hover:bg-accent/10 hover:text-accent"
                  )}
                  aria-label={
                    analysis.inWardrobe
                      ? "Remove from wardrobe"
                      : "Add to wardrobe"
                  }
                >
                  <Shirt className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleRemove(analysis.id);
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
                    <Badge
                      variant={analysis.overallScore >= 70 ? "success" : "warning"}
                    >
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
                  {(analysis.wardrobeTags.length > 0 ||
                    analysis.wardrobeFolderName) && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {analysis.wardrobeTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-muted font-light"
                        >
                          {tag}
                        </span>
                      ))}
                      {analysis.wardrobeFolderName && (
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-light">
                          {analysis.wardrobeFolderName}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2.5 font-light">
                    {formatRelativeTime(analysis.createdAt)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <ItemFolderModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        analysisId={editing?.id ?? ""}
        initialFolderId={editing?.wardrobeFolder}
        initialTags={editing?.wardrobeTags ?? []}
        folders={folders}
        onFoldersChange={setFolders}
        onSaved={(data) => {
          if (!editing) return;
          setFavorites((prev) =>
            prev.map((f) =>
              f.id === editing.id
                ? {
                    ...f,
                    inWardrobe: data.inWardrobe,
                    wardrobeFolder: data.wardrobeFolder,
                    wardrobeFolderName: data.wardrobeFolderName,
                    wardrobeTags: data.wardrobeTags,
                  }
                : f
            )
          );
        }}
      />
    </PageContainer>
  );
}
