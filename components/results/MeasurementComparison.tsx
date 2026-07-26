"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { MeasurementDelta } from "@/types";

interface MeasurementComparisonProps {
  deltas: MeasurementDelta[];
}

export function MeasurementComparison({ deltas }: MeasurementComparisonProps) {
  if (deltas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card"
    >
      <p className="editorial-label mb-4">Measurement Comparison</p>

      <div className="space-y-3">
        {deltas.map((delta) => (
          <div
            key={delta.measurement}
            className="flex items-center justify-between rounded-xl bg-surface border border-border/60 p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{delta.label}</p>
              <p className="text-xs text-muted font-light mt-0.5">
                You: {delta.userValue} {delta.unit}
                {delta.garmentValue && (
                  <> · Garment: {delta.garmentValue} {delta.unit}</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Delta indicator */}
              <div
                className={cn(
                  "text-xs font-medium tabular-nums px-2.5 py-1 rounded-full",
                  delta.status === "ideal" && "bg-success/10 text-success",
                  delta.status === "slightly.tight" && "bg-accent/10 text-accent",
                  delta.status === "slightly.roomy" && "bg-accent/10 text-accent",
                  delta.status === "tight" && "bg-error/10 text-error",
                  delta.status === "roomy" && "bg-warning/10 text-warning"
                )}
              >
                {delta.delta != null && (
                  <>
                    {delta.delta > 0 ? "+" : ""}
                    {delta.delta.toFixed(1)}
                  </>
                )}
              </div>

              {/* Status dot */}
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  delta.status === "ideal" && "bg-success",
                  delta.status === "slightly.tight" && "bg-accent",
                  delta.status === "slightly.roomy" && "bg-accent",
                  delta.status === "tight" && "bg-error",
                  delta.status === "roomy" && "bg-warning"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted font-light">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Ideal fit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Slightly off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-error" /> Tight
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Roomy
        </span>
      </div>
    </motion.div>
  );
}
