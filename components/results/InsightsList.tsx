"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import type { FitInsights } from "@/types";

interface InsightsListProps {
  insights: FitInsights;
}

export function InsightsList({ insights }: InsightsListProps) {
  const hasContent =
    insights.positives.length > 0 ||
    insights.cautions.length > 0 ||
    insights.stylingTips.length > 0;

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
    >
      <p className="editorial-label mb-4">Insights</p>

      <div className="space-y-4">
        {/* Positives */}
        {insights.positives.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
              What works well
            </p>
            <ul className="space-y-2">
              {insights.positives.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-success/5 border border-success/10 p-3"
                >
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-medium text-success">
                      {i + 1}
                    </span>
                  </span>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cautions */}
        {insights.cautions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} />
              Things to consider
            </p>
            <ul className="space-y-2">
              {insights.cautions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-warning/5 border border-warning/10 p-3"
                >
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-warning/10 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-medium text-warning">
                      {i + 1}
                    </span>
                  </span>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Styling Tips */}
        {insights.stylingTips.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              Styling suggestions
            </p>
            <ul className="space-y-2">
              {insights.stylingTips.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-accent/5 border border-accent/10 p-3"
                >
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-medium text-accent">
                      {i + 1}
                    </span>
                  </span>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
