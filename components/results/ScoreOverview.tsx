"use client";

import { motion } from "framer-motion";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { Badge } from "@/components/ui/Badge";
import type { FitScores, SizeRecommendation } from "@/types";

interface ScoreOverviewProps {
  scores: FitScores;
  sizeRecommendation?: SizeRecommendation;
  confidence: number;
}

export function ScoreOverview({
  scores,
  sizeRecommendation,
  confidence,
}: ScoreOverviewProps) {
  const confidenceLabel =
    confidence >= 0.85
      ? "High confidence"
      : confidence >= 0.65
      ? "Estimated"
      : "Low confidence — results may vary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
    >
      {/* Overall Score */}
      <div className="flex flex-col items-center mb-8">
        <ScoreCircle score={scores.overall} size="lg" label="Overall" />
        <div className="mt-4 flex items-center gap-2">
          <Badge variant={confidence >= 0.85 ? "success" : "warning"}>
            {confidenceLabel}
          </Badge>
        </div>
      </div>

      {/* Secondary Scores */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-6">
        <ScoreCircle score={scores.body} size="md" label="Body Fit" />
        <ScoreCircle score={scores.color} size="md" label="Color" />
        <ScoreCircle score={scores.style} size="md" label="Style" />
      </div>

      {/* Size Recommendation */}
      {sizeRecommendation && (
        <div className="mt-6 rounded-xl bg-surface border border-border p-4 text-center">
          <p className="text-[10px] text-muted uppercase tracking-[0.15em] font-medium mb-1">
            Recommended Size
          </p>
          <p className="font-heading text-2xl font-light tracking-tight">
            {sizeRecommendation.suggested}
          </p>
          <p className="text-xs text-muted font-light mt-1">
            {sizeRecommendation.rationale}
          </p>
          {sizeRecommendation.range && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Also consider: {sizeRecommendation.range.join(" or ")}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
