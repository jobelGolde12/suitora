"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MeasurementComparison } from "./MeasurementComparison";
import { SizeRecommendationCard } from "./SizeRecommendationCard";
import { InsightsList } from "./InsightsList";
import type { CompatibilityMetadata, MeasurementDelta } from "@/types";

interface DetailedFitAnalyticsProps {
  metadata: CompatibilityMetadata;
  deltas?: MeasurementDelta[];
}

export function DetailedFitAnalytics({
  metadata,
  deltas = [],
}: DetailedFitAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4",
          "transition-all duration-200 hover:bg-surface/50",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <span className="text-sm font-medium text-foreground">
          Detailed Analysis
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.5} />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              {/* Body Fit Breakdown */}
              <Section title="Body Fit Breakdown">
                <MeasurementComparison deltas={deltas} />
                <div className="mt-4 rounded-xl bg-surface border border-border/60 p-4">
                  <p className="text-xs font-medium text-muted mb-2">
                    Silhouette Compatibility
                  </p>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    The {metadata.itemProfile.silhouette} silhouette is
                    {isFlatteringFor(metadata.bodyProfile.bodyShape, metadata.itemProfile.silhouette)
                      ? " well-suited"
                      : " less ideal"}{" "}
                    for your {metadata.bodyProfile.bodyShape} body shape.
                  </p>
                </div>
                <div className="mt-4 rounded-xl bg-surface border border-border/60 p-4">
                  <p className="text-xs font-medium text-muted mb-2">
                    Fabric & Stretch
                  </p>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    This garment has {metadata.itemProfile.fabricStretch} stretch,
                    which{" "}
                    {metadata.itemProfile.fabricStretch === "high"
                      ? "allows flexibility in sizing"
                      : metadata.itemProfile.fabricStretch === "moderate"
                      ? "provides some give for comfort"
                      : "means fit precision matters more"}
                    .
                  </p>
                </div>
              </Section>

              {/* Color Analysis */}
              <Section title="Color Analysis">
                <div className="space-y-4">
                  {/* Item Colors */}
                  <div>
                    <p className="text-xs font-medium text-muted mb-2">
                      Detected Colors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {metadata.itemProfile.colors.map((color, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="h-7 w-7 rounded-full border border-border shadow-soft"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[11px] text-muted font-light tabular-nums">
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Harmony Note */}
                  <div className="rounded-xl bg-surface border border-border/60 p-4">
                    <p className="text-xs font-medium text-muted mb-2">
                      Skin Tone Harmony
                    </p>
                    <p className="text-sm text-muted font-light leading-relaxed">
                      Your {metadata.bodyProfile.skinTone} undertone{" "}
                      {metadata.scores.color >= 80
                        ? "pairs beautifully with these colors"
                        : metadata.scores.color >= 60
                        ? "works reasonably well with this palette"
                        : "may benefit from a different color selection"}
                      .
                    </p>
                  </div>
                </div>
              </Section>

              {/* Style Insights */}
              <Section title="Style Insights">
                <div className="space-y-4">
                  <div className="rounded-xl bg-surface border border-border/60 p-4">
                    <p className="text-xs font-medium text-muted mb-2">
                      Detected Style
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {metadata.itemProfile.styleTags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-accent/10 text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted font-light leading-relaxed">
                      This item aligns with your preference for{" "}
                      {metadata.bodyProfile.stylePreference.join(", ")} style.
                    </p>
                  </div>
                </div>
              </Section>

              {/* Size Recommendation */}
              <Section title="Size Recommendation">
                <SizeRecommendationCard
                  recommendation={metadata.sizeRecommendation}
                />
              </Section>

              {/* Insights */}
              <Section title="Recommendations">
                <InsightsList insights={metadata.insights} />
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <p className="editorial-label mb-4">{title}</p>
      {children}
    </div>
  );
}

function isFlatteringFor(
  bodyShape: string,
  silhouette: string
): boolean {
  const rules: Record<string, string[]> = {
    hourglass: ["fitted", "wrap", "bodycon", "a-line", "regular"],
    pear: ["a-line", "empire", "relaxed", "flared"],
    apple: ["empire", "a-line", "relaxed", "wrap"],
    rectangle: ["a-line", "flared", "wrap", "empire"],
    "inverted-triangle": ["a-line", "flared", "relaxed"],
    triangle: ["a-line", "empire", "fitted"],
  };

  return rules[bodyShape]?.includes(silhouette) ?? true;
}
