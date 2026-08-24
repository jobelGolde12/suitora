"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { FolderOpen, Heart, Pencil, Settings2, Shirt, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  fadeInUp,
  FavoritesSkeleton,
} from "@/components/dashboard";
import { OutfitSuggestions } from "@/components/wardrobe/OutfitSuggestions";
import { FolderManagerModal } from "@/components/wardrobe/FolderManagerModal";
import {
  ItemFolderModal,
  type WardrobeFolderOption,
} from "@/components/wardrobe/ItemFolderModal";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import { extractCategory } from "@/lib/utils/analysis";
import { fetcher } from "@/lib/utils/fetcher";
import type { AnalysisResult, FavoriteItem } from "@/types";

interface WardrobeItem {
  id: string;
  analysisId: string;
  inWardrobe: boolean;
  wardrobeTags: string[];
  wardrobeFolder: string | null;
  wardrobeFolderName: string | null;
  addedToWardrobeAt?: string | null;
  analysis: AnalysisResult & { category?: string | null };
}

export default function WardrobePage() {
  const { addToast } = useToast();
  const [activeFolder, setActiveFolder] = useState<"all" | "none" | string>("all");
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [itemToRemove, setItemToRemove] = useState<WardrobeItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  // Local state for optimistic updates after mutations
  const [items, setItems] = useState<WardrobeItem[] | null>(null);
  const [localFolders, setLocalFolders] = useState<WardrobeFolderOption[] | null>(null);

  const { data: wardrobeData, isLoading: wardrobeLoading } = useSWR<
    { items: WardrobeItem[]; folders: WardrobeFolderOption[] }
  >("/api/wardrobe", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const { data: favData } = useSWR<
    { favorites: FavoriteItem[] }
  >("/api/favorites", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  // Derive items from SWR data (or use local state for optimistic updates)
  const allItems: WardrobeItem[] = useMemo(() => {
    if (items) return items;
    if (!wardrobeData) return [];
    return (wardrobeData.items ?? []).map((item: WardrobeItem) => ({
      ...item,
      analysis: {
        ...item.analysis,
        category: extractCategory(item.analysis),
      },
    }));
  }, [wardrobeData, items]);

  const folders = localFolders ?? wardrobeData?.folders ?? [];
  const hasFavorites = (favData?.favorites?.length ?? 0) > 0;

  const filtered = useMemo(() => {
    if (activeFolder === "all") return allItems;
    if (activeFolder === "none") {
      return allItems.filter((i) => !i.wardrobeFolder);
    }
    return allItems.filter((i) => i.wardrobeFolder === activeFolder);
  }, [allItems, activeFolder]);

  const handleRemoveFromWardrobe = async (item: WardrobeItem) => {
    if (isRemoving) return;
    setIsRemoving(true);
    // Optimistic update
    const prev = allItems;
    setItems(allItems.filter((i) => i.analysisId !== item.analysisId));
    try {
      const res = await fetch("/api/favorites", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: item.analysisId,
          inWardrobe: false,
          wardrobeFolder: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast("Removed from wardrobe", "success");
    } catch (err) {
      console.error(err);
      setItems(prev); // Rollback
      addToast("Failed to update wardrobe", "error");
    } finally {
      setIsRemoving(false);
      setItemToRemove(null);
    }
  };

  const handleFolderRenamed = (id: string, name: string) => {
    setItems((prev) =>
      (prev ?? allItems).map((i) =>
        i.wardrobeFolder === id ? { ...i, wardrobeFolderName: name } : i
      )
    );
  };

  const handleFolderDeleted = (id: string) => {
    setActiveFolder((current) => (current === id ? "all" : current));
    setItems((prev) =>
      (prev ?? allItems).map((i) =>
        i.wardrobeFolder === id
          ? { ...i, wardrobeFolder: null, wardrobeFolderName: null }
          : i
      )
    );
  };

  if (wardrobeLoading) {
    return <FavoritesSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        label="Closet"
        title="Wardrobe"
        description={`${allItems.length} item${allItems.length === 1 ? "" : "s"} organized for outfit ideas.`}
        action={
          <Link href="/favorites">
            <Button variant="editorial" className="rounded-full px-6">
              Browse Favorites
            </Button>
          </Link>
        }
      />

      <OutfitSuggestions wardrobeCount={allItems.length} />

      {allItems.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFolder("all")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              activeFolder === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFolder("none")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              activeFolder === "none"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            Unfiled ({allItems.filter((i) => !i.wardrobeFolder).length})
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setActiveFolder(folder.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                activeFolder === folder.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:text-foreground"
              )}
            >
              {folder.name} ({folder.itemCount ?? 0})
            </button>
          ))}
          {folders.length > 0 && (
            <button
              type="button"
              onClick={() => setIsFolderManagerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Manage folders
            </button>
          )}
        </div>
      )}

      {allItems.length === 0 ? (
        <EmptyState
          icon={!hasFavorites ? Heart : Shirt}
          title={!hasFavorites ? "No favorites yet" : "Wardrobe is empty"}
          description={
            !hasFavorites
              ? "Save analyses you love, then add them to your wardrobe."
              : "Toggle the wardrobe icon on a favorite to keep it organized here."
          }
          action={
            <Link href="/favorites">
              <Button variant="editorial" className="rounded-full px-6">
                Go to Favorites
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="This folder is empty"
          description="Move items here from the edit menu, or pick another folder."
          action={
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => setActiveFolder("all")}
            >
              Show all
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const analysis = item.analysis;
            return (
              <motion.div
                key={item.analysisId}
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
                      alt="Wardrobe item"
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
                    onClick={() => setEditing(item)}
                    className="absolute top-3 right-14 h-9 w-9 rounded-full border border-border bg-card/90 text-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent/10 hover:text-accent"
                    aria-label="Edit folder and tags"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToRemove(item)}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Remove from wardrobe"
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
                    {(item.wardrobeTags.length > 0 || item.wardrobeFolderName) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {item.wardrobeTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-muted font-light"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.wardrobeFolderName && (
                          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-light">
                            {item.wardrobeFolderName}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2.5 font-light">
                      {formatRelativeTime(
                        item.addedToWardrobeAt || analysis.createdAt
                      )}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <ItemFolderModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        analysisId={editing?.analysisId ?? ""}
        initialFolderId={editing?.wardrobeFolder}
        initialTags={editing?.wardrobeTags ?? []}
        folders={folders}
        onFoldersChange={(newFolders) => setLocalFolders(newFolders)}
        onSaved={(data) => {
          if (!editing) return;
          setItems((prev) =>
            (prev ?? allItems).map((i) =>
              i.analysisId === editing.analysisId
                ? {
                    ...i,
                    inWardrobe: data.inWardrobe,
                    wardrobeFolder: data.wardrobeFolder,
                    wardrobeFolderName: data.wardrobeFolderName,
                    wardrobeTags: data.wardrobeTags,
                  }
                : i
            )
          );
          setLocalFolders((prev) =>
            (prev ?? folders).map((f) => {
              const wasIn = editing.wardrobeFolder === f.id;
              const nowIn = data.wardrobeFolder === f.id;
              if (wasIn === nowIn) return f;
              const delta = nowIn ? 1 : -1;
              return {
                ...f,
                itemCount: Math.max(0, (f.itemCount ?? 0) + delta),
              };
            })
          );
        }}
      />

      <FolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        folders={folders}
        onFoldersChange={(newFolders) => setLocalFolders(newFolders)}
        onFolderRenamed={handleFolderRenamed}
        onFolderDeleted={handleFolderDeleted}
      />

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          if (itemToRemove) void handleRemoveFromWardrobe(itemToRemove);
        }}
        title="Remove from wardrobe?"
        description={`"${itemToRemove?.analysis.category ?? "This item"}" will be removed from your wardrobe.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </PageContainer>
  );
}
