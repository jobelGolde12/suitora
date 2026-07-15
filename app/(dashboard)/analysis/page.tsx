"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { analyzeFashion } from "@/lib/ai/mock-analysis";
import type { AnalysisProgress } from "@/types";

const stageMessages: Record<string, string> = {
  detecting: "Detecting person in image...",
  analyzing: "Analyzing body shape & features...",
  "try-on": "Generating virtual try-on...",
  scoring: "Calculating compatibility scores...",
  complete: "Analysis complete!",
};

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
      } catch (err) {
        setError("Something went wrong during analysis. Please try again.");
      }
    };

    runAnalysis();
  }, [router, handleProgress]);

  const getStageIndex = (stage: string): number => {
    const stages = ["detecting", "analyzing", "try-on", "scoring", "complete"] as const;
    return stages.indexOf(stage as typeof stages[number]);
  };

  const getStageStatus = (stageName: string): "completed" | "active" | "pending" => {
    const current = getStageIndex(progress.stage);
    const target = getStageIndex(stageName);
    if (target < current) return "completed";
    if (target === current) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-error" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
            <p className="text-sm text-muted mb-6">{error}</p>
            <button
              onClick={() => router.push("/upload")}
              className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex justify-center mb-8"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <div className="mb-8">
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted mt-2">{Math.round(progress.progress)}%</p>
            </div>

            <div className="space-y-4">
              {Object.entries(stageMessages).map(([stage, message]) => {
                const status = getStageStatus(stage);
                return (
                  <div
                    key={stage}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                      ${status === "active" ? "bg-primary/5 border border-primary/20" : ""}
                      ${status === "completed" ? "bg-success/5" : ""}
                      ${status === "pending" ? "opacity-40" : ""}
                    `}
                  >
                    <div
                      className={`
                        flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                        ${status === "completed" ? "bg-success text-white" : ""}
                        ${status === "active" ? "bg-primary text-white" : ""}
                        ${status === "pending" ? "bg-surface text-muted border border-border" : ""}
                      `}
                    >
                      {status === "completed" ? "✓" : status === "active" ? "●" : String(getStageIndex(stage) + 1)}
                    </div>
                    <p
                      className={`
                        text-sm transition-all duration-300
                        ${status === "active" ? "text-foreground font-medium" : ""}
                        ${status === "completed" ? "text-muted line-through" : ""}
                        ${status === "pending" ? "text-muted-foreground" : ""}
                      `}
                    >
                      {message}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-1 mt-8">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="h-2 w-2 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
