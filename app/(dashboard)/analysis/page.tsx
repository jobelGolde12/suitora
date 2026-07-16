"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { analyzeFashion } from "@/lib/ai/mock-analysis";
import type { AnalysisProgress } from "@/types";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "@/components/dashboard";

const stageMessages: Record<string, string> = {
  detecting: "Detecting person in image...",
  analyzing: "Analyzing body shape & features...",
  "try-on": "Generating virtual try-on...",
  scoring: "Calculating compatibility scores...",
  complete: "Analysis complete!",
};

const stages = ["detecting", "analyzing", "try-on", "scoring", "complete"] as const;

export default function AnalysisPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: "detecting",
    progress: 0,
    message: stageMessages.detecting,
  });
  const [error, setError] = useState<string | null>(null);

  const handleProgress = useCallback((stage: string, pct: number, message: string) => {
    setProgress({
      stage: stage as AnalysisProgress["stage"],
      progress: pct,
      message,
    });
  }, []);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        await analyzeFashion(
          {
            userImageUrl: "/placeholder.svg",
            clothingImageUrl: "/placeholder.svg",
          },
          handleProgress
        );

        await new Promise((resolve) => setTimeout(resolve, 800));
        router.push(`/results/mock_result_${Date.now()}`);
      } catch {
        setError("Something went wrong during analysis. Please try again.");
      }
    };

    runAnalysis();
  }, [router, handleProgress]);

  const getStageIndex = (stage: string): number =>
    stages.indexOf(stage as (typeof stages)[number]);

  const getStageStatus = (stageName: string): "completed" | "active" | "pending" => {
    const current = getStageIndex(progress.stage);
    const target = getStageIndex(stageName);
    if (target < current) return "completed";
    if (target === current) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        {error ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center rounded-2xl border border-border bg-card p-10 shadow-card"
          >
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-full border border-error/20 bg-error/5 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-error" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="font-heading text-2xl font-light tracking-tight mb-2">
              Analysis Failed
            </h2>
            <p className="text-sm text-muted font-light mb-8">{error}</p>
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => router.push("/upload")}
            >
              Try Again
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <div className="flex justify-center mb-10">
              <div className="h-16 w-16 rounded-full border border-accent/30 bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-accent" strokeWidth={1.5} />
              </div>
            </div>

            <p className="editorial-label mb-3">Analyzing</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-light tracking-tight mb-8">
              Working on your fit
            </h2>

            {/* Soft progress bar — skeleton-like, no spinner */}
            <div className="mb-10">
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent/80"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted mt-3 font-light tabular-nums">
                {Math.round(progress.progress)}%
              </p>
            </div>

            <div className="space-y-2 text-left">
              {Object.entries(stageMessages).map(([stage, message]) => {
                const status = getStageStatus(stage);
                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200",
                      status === "active" && "bg-surface border-border",
                      status === "completed" && "bg-card border-transparent",
                      status === "pending" && "bg-transparent border-transparent opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-200 border",
                        status === "completed" && "bg-success/10 border-success/20 text-success",
                        status === "active" && "bg-accent/10 border-accent/30 text-accent",
                        status === "pending" && "bg-surface border-border text-muted"
                      )}
                    >
                      {status === "completed"
                        ? "✓"
                        : status === "active"
                          ? "·"
                          : String(getStageIndex(stage) + 1)}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-light transition-all duration-200",
                        status === "active" && "text-foreground font-medium",
                        status === "completed" && "text-muted",
                        status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {message}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
