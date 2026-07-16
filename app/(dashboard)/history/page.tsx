"use client";

import { useState } from "react";
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

const mockHistory: (Analysis & { isFavorite: boolean })[] = [
  { id: "1", userId: "1", userImage: "", productImage: "", overallScore: 85, bodyScore: 82, styleScore: 88, colorScore: 79, createdAt: new Date(Date.now() - 3600000).toISOString(), isFavorite: true },
  { id: "2", userId: "1", userImage: "", productImage: "", overallScore: 62, bodyScore: 65, styleScore: 58, colorScore: 70, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), isFavorite: false },
  { id: "3", userId: "1", userImage: "", productImage: "", overallScore: 91, bodyScore: 93, styleScore: 90, colorScore: 88, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), isFavorite: true },
  { id: "4", userId: "1", userImage: "", productImage: "", overallScore: 74, bodyScore: 70, styleScore: 76, colorScore: 78, createdAt: new Date(Date.now() - 86400000 * 8).toISOString(), isFavorite: false },
  { id: "5", userId: "1", userImage: "", productImage: "", overallScore: 55, bodyScore: 60, styleScore: 50, colorScore: 45, createdAt: new Date(Date.now() - 86400000 * 12).toISOString(), isFavorite: false },
  { id: "6", userId: "1", userImage: "", productImage: "", overallScore: 88, bodyScore: 85, styleScore: 90, colorScore: 82, createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), isFavorite: true },
];

export default function HistoryPage() {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [analyses, setAnalyses] = useState(mockHistory);

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

  const handleDelete = (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    addToast("Analysis removed", "success");
  };

  const toggleFavorite = (id: string) => {
    setAnalyses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a))
    );
    const analysis = analyses.find((a) => a.id === id);
    addToast(
      analysis?.isFavorite ? "Removed from favorites" : "Added to favorites",
      "success"
    );
  };

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
                "px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sortBy === sort
                  ? "bg-foreground text-background"
                  : "bg-surface text-muted hover:text-foreground border border-border"
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
