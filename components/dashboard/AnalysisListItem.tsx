"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import { formatCategoryLabel, getCategoryConfig } from "@/config/category-display";
import { fadeInUp } from "./motion";

interface AnalysisListItemProps {
  id: string;
  overallScore: number;
  createdAt: string;
  isFavorite?: boolean;
  /** Item category when available from compatibility metadata */
  category?: string | null;
  delay?: number;
  className?: string;
}

export function AnalysisListItem({
  id,
  overallScore,
  createdAt,
  isFavorite,
  category,
  delay = 0,
  className,
}: AnalysisListItemProps) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;
  const title = category
    ? `${formatCategoryLabel(category)} analysis`
    : "Clothing Analysis";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
    >
      <Link
        href={`/results/${id}`}
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card",
          "editorial-card-hover group",
          className
        )}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface">
          <span
            className={cn(
              "font-heading text-lg font-medium tabular-nums",
              getScoreColor(overallScore)
            )}
          >
            {formatScore(overallScore)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted shrink-0" strokeWidth={1.5} />
            <p className="text-sm font-medium truncate">{title}</p>
            {isFavorite && (
              <Heart className="h-3 w-3 text-accent fill-accent shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {category && <CategoryBadge category={category} />}
            <Badge variant={overallScore >= 70 ? "success" : "warning"}>
              {overallScore >= 70 ? "Good Match" : "Average"}
            </Badge>
            <span className="text-xs text-muted font-light">
              {formatRelativeTime(createdAt)}
            </span>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-muted/50 group-hover:text-foreground transition-colors duration-200 shrink-0" />
      </Link>
    </motion.div>
  );
}
