"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, Check, Shirt, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  fadeInUp,
  HistorySkeleton,
} from "@/components/dashboard";
import { ComparisonView } from "@/components/compare/ComparisonView";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { AnalysisResult } from "@/types";

const MAX_SELECTION = 4;

export default function ComparePage() {
  const { addToast } = useToast();
  const [analyses, setAnalyses] = useState<(AnalysisResult & { isFavorite: boolean })[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadAnalyses = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/analysis?limit=24", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load analyses");
      const data = await res.json();
      setAnalyses((data?.analyses ?? []) as (AnalysisResult & { isFavorite: boolean })[]);
    } catch (err) {
      console.error("Failed to load analyses:", err);
      setLoadError(true);
      addToast("Failed to load your analyses", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAnalyses());
  }, [loadAnalyses]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_SELECTION) {
        addToast(`Compare up to ${MAX_SELECTION} items at once`, "error");
        return prev;
      }
      return [...prev, id];
    });
  };

  const selected = useMemo(
    () =>
      analyses
        .filter((a) => selectedIds.includes(a.id))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [analyses, selectedIds]
  );

  const sortedAnalyses = useMemo(
    () =>
      [...analyses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [analyses]
  );

  if (isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        label="Compare"
        title="Compare Styles"
        description="Select up to four analyses and see how they stack up side by side."
        action={
          <Link href="/upload">
            <Button variant="editorial" className="rounded-full px-6">
              New Analysis
            </Button>
          </Link>
        }
      />

      {loadError ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load your analyses"
          description="Something went wrong while fetching your analyses. Check your connection and try again."
          action={
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => void loadAnalyses()}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              Retry
            </Button>
          }
        />
      ) : analyses.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing to compare yet"
          description="Run a few analyses first, then come back to compare them."
          action={
            <Link href="/upload">
              <Button variant="editorial" className="rounded-full px-6">
                Start Your First Analysis
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
            className="mb-8"
          >
            <p className="text-xs text-muted font-light mb-4">
              {selectedIds.length === 0
                ? "Tap the cards to add them to the comparison."
                : selectedIds.length === 1
                  ? "1 of 4 selected — choose one more item to start comparing."
                  : `${selectedIds.length} of ${MAX_SELECTION} selected.`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedAnalyses.map((analysis, i) => {
                const isSelected = selectedIds.includes(analysis.id);
                return (
                  <motion.button
                    key={analysis.id}
                    type="button"
                    onClick={() => toggleSelection(analysis.id)}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    custom={i + 2}
                    className={cn(
                      "relative rounded-2xl border bg-card overflow-hidden text-left transition-all duration-200 cursor-pointer",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "border-accent ring-2 ring-accent/40 shadow-soft"
                        : "border-border hover:border-accent/40"
                    )}
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Remove analysis from comparison`
                        : `Add analysis to comparison`
                    }
                  >
                    <div className="aspect-[4/5] bg-surface relative overflow-hidden">
                      {analysis.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={analysis.productImage}
                          alt="Clothing item"
                          className="w-full h-full object-cover opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="h-8 w-8 text-muted/40" strokeWidth={1.25} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center shadow-soft">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <div>
                        <span
                          className={cn(
                            "font-heading text-sm font-medium tabular-nums",
                            getScoreColor(analysis.overallScore)
                          )}
                        >
                          {formatScore(analysis.overallScore)}
                        </span>
                        <p className="text-[11px] text-muted font-light mt-0.5">
                          {formatRelativeTime(analysis.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <AnimatePresence>
            {selected.length >= 2 && (
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2">
                  <GitCompareArrows className="h-5 w-5 text-accent" strokeWidth={1.5} />
                  <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
                    Comparison
                  </h2>
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                    {selected.length} items
                  </span>
                </div>
                <ComparisonView analyses={selected} />
              </motion.section>
            )}
          </AnimatePresence>
        </>
      )}
    </PageContainer>
  );
}
