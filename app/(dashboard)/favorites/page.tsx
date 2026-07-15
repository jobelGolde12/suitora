"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import {
  Heart,
  Shirt,
  Trash2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { Analysis } from "@/types";

const mockFavorites: (Analysis & { isFavorite: boolean })[] = [
  { id: "1", userId: "1", userImage: "", productImage: "", overallScore: 85, bodyScore: 82, styleScore: 88, colorScore: 79, createdAt: new Date(Date.now() - 3600000).toISOString(), isFavorite: true },
  { id: "3", userId: "1", userImage: "", productImage: "", overallScore: 91, bodyScore: 93, styleScore: 90, colorScore: 88, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), isFavorite: true },
  { id: "6", userId: "1", userImage: "", productImage: "", overallScore: 88, bodyScore: 85, styleScore: 90, colorScore: 82, createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), isFavorite: true },
];

const easeInOutQuad: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: easeInOutQuad },
  }),
};

export default function FavoritesPage() {
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState(mockFavorites);

  const handleRemove = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    addToast("Removed from favorites", "success");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
            <p className="text-sm text-muted mt-1">
              Your saved analyses ({favorites.length} items)
            </p>
          </div>
          <Link href="/history">
            <Button variant="secondary">Browse History</Button>
          </Link>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent>
                <div className="text-center py-16">
                  <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
                  <p className="font-semibold text-lg">No favorites yet</p>
                  <p className="text-sm text-muted mt-1">
                    Save analyses you love to find them here later
                  </p>
                  <Link href="/history">
                    <Button variant="secondary" className="mt-6">
                      Browse History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((analysis, i) => (
              <motion.div
                key={analysis.id}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                custom={i}
                className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden"
              >
                {/* Image Preview */}
                <div className="h-36 bg-gradient-to-br from-rose-500/10 to-pink-500/10 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="h-10 w-10 text-rose-300" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg text-white",
                      analysis.overallScore >= 80 ? "bg-success/90" : analysis.overallScore >= 60 ? "bg-warning/90" : "bg-error/90"
                    )}>
                      {formatScore(analysis.overallScore)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemove(analysis.id); }}
                    className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-error/80 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link href={`/results/${analysis.id}`}>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={analysis.overallScore >= 70 ? "success" : "warning"}>
                        {analysis.overallScore >= 70 ? "Good Match" : "Average"}
                      </Badge>
                      <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
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
