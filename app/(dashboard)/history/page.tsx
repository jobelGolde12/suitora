"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import {
  Search,
  Shirt,
  Clock,
  Heart,
  Trash2,
  ArrowRight,
  BarChart3,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { Analysis } from "@/types";

// Mock data
const mockHistory: (Analysis & { isFavorite: boolean })[] = [
  { id: "1", userId: "1", userImage: "", productImage: "", overallScore: 85, bodyScore: 82, styleScore: 88, colorScore: 79, createdAt: new Date(Date.now() - 3600000).toISOString(), isFavorite: true },
  { id: "2", userId: "1", userImage: "", productImage: "", overallScore: 62, bodyScore: 65, styleScore: 58, colorScore: 70, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), isFavorite: false },
  { id: "3", userId: "1", userImage: "", productImage: "", overallScore: 91, bodyScore: 93, styleScore: 90, colorScore: 88, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), isFavorite: true },
  { id: "4", userId: "1", userImage: "", productImage: "", overallScore: 74, bodyScore: 70, styleScore: 76, colorScore: 78, createdAt: new Date(Date.now() - 86400000 * 8).toISOString(), isFavorite: false },
  { id: "5", userId: "1", userImage: "", productImage: "", overallScore: 55, bodyScore: 60, styleScore: 50, colorScore: 45, createdAt: new Date(Date.now() - 86400000 * 12).toISOString(), isFavorite: false },
  { id: "6", userId: "1", userImage: "", productImage: "", overallScore: 88, bodyScore: 85, styleScore: 90, colorScore: 82, createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), isFavorite: true },
];

const easeInOutQuad: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: easeInOutQuad },
  }),
};

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">History</h1>
            <p className="text-sm text-muted mt-1">
              Browse all your past analyses ({analyses.length} total)
            </p>
          </div>
          <Link href="/upload">
            <Button>New Analysis</Button>
          </Link>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" />
            {(["newest", "highest", "lowest"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  sortBy === sort
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-foreground"
                )}
              >
                {sort === "newest" ? "Newest" : sort === "highest" ? "Highest Score" : "Lowest Score"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent>
                <div className="text-center py-16">
                  <Clock className="h-16 w-16 text-muted mx-auto mb-4" />
                  <p className="font-semibold text-lg">No analyses found</p>
                  <p className="text-sm text-muted mt-1">
                    {searchQuery ? "Try a different search term" : "Your analysis history will appear here"}
                  </p>
                  {!searchQuery && (
                    <Link href="/upload">
                      <Button variant="secondary" className="mt-6">
                        Start Your First Analysis
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                custom={i}
                className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden"
              >
                {/* Image Preview */}
                <div className="h-36 bg-surface relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="h-10 w-10 text-muted/50" />
                  </div>
                  {/* Score Badge */}
                  <div className="absolute top-3 left-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg",
                      getScoreColor(analysis.overallScore).replace("text-", "bg-").replace("success", "success/90").replace("warning", "warning/90").replace("error", "error/90"),
                      "text-white"
                    )}>
                      {formatScore(analysis.overallScore)}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(analysis.id); }}
                      className="h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <Heart className={cn("h-4 w-4", analysis.isFavorite && "fill-white")} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(analysis.id); }}
                      className="h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-error/80 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <Link href={`/results/${analysis.id}`}>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={analysis.overallScore >= 70 ? "success" : "warning"}
                      >
                        {analysis.overallScore >= 70 ? "Good Match" : "Average"}
                      </Badge>
                      {analysis.isFavorite && (
                        <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Body {formatScore(analysis.bodyScore ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Style {formatScore(analysis.styleScore ?? 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeTime(analysis.createdAt)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
