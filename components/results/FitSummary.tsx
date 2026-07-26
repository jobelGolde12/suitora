"use client";

import { motion } from "framer-motion";
import type { FitInsights, ItemCategory } from "@/types";

interface FitSummaryProps {
  insights: FitInsights;
  category: ItemCategory;
  scores: { overall: number; body: number };
}

export function FitSummary({ insights, category, scores }: FitSummaryProps) {
  // Generate a calm editorial summary based on the analysis
  const summary = generateSummary(insights, category, scores);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
    >
      <p className="editorial-label mb-3">Summary</p>
      <p className="font-heading text-lg sm:text-xl font-light tracking-tight leading-relaxed text-foreground">
        {summary}
      </p>
    </motion.div>
  );
}

function generateSummary(
  insights: FitInsights,
  category: ItemCategory,
  scores: { overall: number; body: number }
): string {
  const positives = insights.positives;
  const cautions = insights.cautions;

  if (scores.overall >= 85) {
    return (
      `This ${getCategoryLabel(category)} is an excellent match for your body profile. ` +
      (positives[0] ? `${positives[0]}. ` : "") +
      `The overall compatibility is very strong — a confident choice.`
    );
  }

  if (scores.overall >= 70) {
    return (
      `This ${getCategoryLabel(category)} works well with your proportions. ` +
      (positives[0] ? `${positives[0]}. ` : "") +
      (cautions[0] ? `One note: ${cautions[0].toLowerCase()}.` : "A solid option for your wardrobe.")
    );
  }

  if (scores.overall >= 55) {
    return (
      `This ${getCategoryLabel(category)} has some compatibility with your frame, but isn't the strongest match. ` +
      (cautions[0] ? `${cautions[0]}. ` : "") +
      (positives[0] ? `However, ${positives[0].toLowerCase()}.` : "Consider exploring similar alternatives.")
    );
  }

  return (
    `This ${getCategoryLabel(category)} may not be the most flattering choice for your body profile. ` +
    (cautions[0] ? `${cautions[0]}. ` : "") +
    "You might find a better match with a different silhouette or style."
  );
}

function getCategoryLabel(category: ItemCategory): string {
  const labels: Record<ItemCategory, string> = {
    tops: "top",
    dresses: "dress",
    bottoms: "bottom",
    outerwear: "outerwear piece",
    footwear: "pair of shoes",
    headwear: "headwear",
    accessories: "accessory",
    activewear: "activewear piece",
    formal: "formal piece",
  };
  return labels[category] || "item";
}
