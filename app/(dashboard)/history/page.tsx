"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Shirt,
  Clock,
  Heart,
  Trash2,
  BarChart3,
  Filter,
  Plus,
} from "lucide-react";
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

export default function HistoryPage() {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [analyses, setAnalyses] = useState<(Analysis & { isFavorite: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/analysis");
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error("Failed to load analysis history:", err);
      addToast("Failed to load analysis history", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = analyses
    .filter(
      (a) =>
        a.overallScore.toString().includes(searchQuery) ||
        formatRelativeTime(a.createdAt).toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "highest") return b.overallScore - a.overallScore;
      return a.overallScore - b.overallScore;
    });

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/analysis?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
        addToast("Analysis removed", "success");
      } else {
        throw new Error("Failed to delete analysis");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to delete analysis", "error");
    }
  };

  const toggleFavorite = async (id: string) => {
    const analysis = analyses.find((a) => a.id === id);
    if (!analysis) return;

    try {
      if (analysis.isFavorite) {
        const res = await fetch(`/api/favorites?analysisId=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setAnalyses((prev) =>
            prev.map((a) => (a.id === id ? { ...a, isFavorite: false } : a))
          );
          addToast("Removed from favorites", "success");
        } else {
          throw new Error("Failed to remove favorite");
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ analysisId: id }),
        });
        if (res.ok) {
          setAnalyses((prev) =>
            prev.map((a) => (a.id === id ? { ...a, isFavorite: true } : a))
          );
          addToast("Added to favorites", "success");
        } else {
          throw new Error("Failed to add favorite");
        }
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update favorite status", "error");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted font-light">Loading archive...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        label="Archive"
        title="History"
        description={`Browse all your past analyses (${analyses.length} total).`}
        action={
          <Link href="/upload">
            <Button variant="editorial" className="rounded-full px-6">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              New Analysis
            </Button>
          </Link>
        }
      />

      {/* Search & Filter */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={1}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted shrink-0" strokeWidth={1.5} />
          {(["newest", "highest", "lowest"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={cn(
                "border px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sortBy === sort
                  ? "bg-foreground text-background border-transparent"
                  : "bg-surface text-muted hover:text-foreground border-border"
              )}
            >
              {sort === "newest" ? "Newest" : sort === "highest" ? "Highest" : "Lowest"}
            </button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No analyses found"
          description={
            searchQuery
              ? "Try a different search term"
              : "Your analysis history will appear here"
          }
          action={
            !searchQuery ? (
              <Link href="/upload">
                <Button variant="editorial" className="rounded-full px-6">
                  Start Your First Analysis
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((analysis, i) => (
            <motion.div
              key={analysis.id}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={i + 2}
              className="group rounded-2xl border border-border bg-card shadow-card editorial-card-hover overflow-hidden"
            >
              <div className="h-36 bg-surface relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {analysis.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={analysis.productImage}
                      alt="Clothing item"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Shirt className="h-10 w-10 text-muted/40" strokeWidth={1.25} />
                  )}
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
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(analysis.id);
                    }}
                    className="h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={analysis.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={cn("h-4 w-4", analysis.isFavorite && "fill-accent text-accent")}
                      strokeWidth={1.5}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(analysis.id);
                    }}
                    className="h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Delete analysis"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <Link href={`/results/${analysis.id}`}>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={analysis.overallScore >= 70 ? "success" : "warning"}>
                      {analysis.overallScore >= 70 ? "Good Match" : "Average"}
                    </Badge>
                    {analysis.isFavorite && (
                      <Heart className="h-3 w-3 text-accent fill-accent" />
                    )}
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
