"use client";

import Link from "next/link";
import { Trophy, Calendar, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { ScoreBar } from "@/components/dashboard";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AnalysisResult } from "@/types";

interface ComparisonViewProps {
  analyses: AnalysisResult[];
}

interface BestScores {
  overall: number;
  body: number;
  style: number;
  color: number;
}

function findBestScores(analyses: AnalysisResult[]): BestScores {
  return analyses.reduce<BestScores>(
    (best, a) => ({
      overall: Math.max(best.overall, a.overallScore),
      body: Math.max(best.body, a.bodyScore ?? 0),
      style: Math.max(best.style, a.styleScore ?? 0),
      color: Math.max(best.color, a.colorScore ?? 0),
    }),
    { overall: -1, body: -1, style: -1, color: -1 }
  );
}

export function ComparisonView({ analyses }: ComparisonViewProps) {
  const best = findBestScores(analyses);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {analyses.map((analysis) => {
        const isOverallBest =
          best.overall > 0 && analysis.overallScore >= best.overall;

        return (
          <Card
            key={analysis.id}
            className="relative overflow-hidden p-0 group"
          >
            <div className="relative aspect-[4/5] bg-surface overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analysis.productImage}
                alt="Clothing item being compared"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {isOverallBest && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-white shadow-soft">
                  <Trophy className="h-3 w-3" strokeWidth={1.5} />
                  Best overall
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <ScoreCircle
                  score={analysis.overallScore}
                  size="sm"
                  label="Overall"
                />
                <span className="flex items-center gap-1 text-xs text-muted font-light tabular-nums">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {formatRelativeTime(analysis.createdAt)}
                </span>
              </div>

              <div className="space-y-3">
                <DimensionScore
                  label="Body fit"
                  score={analysis.bodyScore ?? 0}
                  isBest={best.body > 0 && (analysis.bodyScore ?? 0) >= best.body}
                />
                <DimensionScore
                  label="Style"
                  score={analysis.styleScore ?? 0}
                  isBest={best.style > 0 && (analysis.styleScore ?? 0) >= best.style}
                />
                <DimensionScore
                  label="Color"
                  score={analysis.colorScore ?? 0}
                  isBest={best.color > 0 && (analysis.colorScore ?? 0) >= best.color}
                />
              </div>
            </div>

            <Link
              href={`/results/${analysis.id}`}
              className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-xs font-medium text-muted transition-colors duration-200 hover:text-accent hover:bg-surface/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              View full analysis
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

function DimensionScore({
  label,
  score,
  isBest,
}: {
  label: string;
  score: number;
  isBest: boolean;
}) {
  return (
    <div className={cn("relative", isBest && "pl-3")}>
      {isBest && (
        <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-accent" />
      )}
      <ScoreBar label={label} score={score} />
    </div>
  );
}
