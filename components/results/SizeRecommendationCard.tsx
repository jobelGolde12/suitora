"use client";

import { motion } from "framer-motion";
import { Shirt } from "lucide-react";
import type { SizeRecommendation } from "@/types";

interface SizeRecommendationCardProps {
  recommendation: SizeRecommendation;
}

export function SizeRecommendationCard({
  recommendation,
}: SizeRecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
          <Shirt className="h-5 w-5 text-muted" strokeWidth={1.5} />
        </div>
        <div>
          <p className="editorial-label">Size Advice</p>
          <p className="text-sm text-muted font-light">
            Based on your measurements and the garment dimensions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Suggested size */}
        <div className="text-center">
          <p className="text-[10px] text-muted uppercase tracking-[0.15em] font-medium mb-1">
            Recommended
          </p>
          <p className="font-heading text-4xl font-light tracking-tight">
            {recommendation.suggested}
          </p>
        </div>

        {/* Range if available */}
        {recommendation.range && recommendation.range.length > 0 && (
          <div className="text-center">
            <p className="text-[10px] text-muted uppercase tracking-[0.15em] font-medium mb-1">
              Also Consider
            </p>
            <p className="font-heading text-lg font-light tracking-tight text-muted">
              {recommendation.range.join(" / ")}
            </p>
          </div>
        )}
      </div>

      {/* Rationale */}
      <p className="mt-4 text-sm text-muted font-light leading-relaxed">
        {recommendation.rationale}
      </p>
    </motion.div>
  );
}
