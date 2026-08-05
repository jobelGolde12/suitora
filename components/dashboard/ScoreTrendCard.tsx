"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { formatDate, getScoreColor, getScoreLabel } from "@/lib/utils/format";

interface ScoreTrendCardProps {
  data: number[];
  dates?: string[];
  bestScore?: number | null;
  className?: string;
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 8;

export function ScoreTrendCard({
  data,
  dates,
  bestScore,
  className,
}: ScoreTrendCardProps) {
  const values = data.length > 0 ? data : [0];
  const max = Math.max(...values, 60);
  const min = Math.min(...values, 40);
  const range = Math.max(1, max - min);

  const points = values.map((value, i) => {
    const x = PAD + (i * (WIDTH - PAD * 2)) / Math.max(1, values.length - 1);
    const y = HEIGHT - PAD - ((value - min) / range) * (HEIGHT - PAD * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${HEIGHT - PAD} L${points[0].x.toFixed(1)},${HEIGHT - PAD} Z`
      : "";

  const current = values[values.length - 1];
  const first = values[0];
  const delta = current - first;
  const improved = delta >= 0;
  const currentColor = getScoreColor(current);
  const last = points[points.length - 1];
  const firstDate = dates?.[0];
  const lastDate = dates?.[dates.length - 1];

  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            Score trend
          </p>
          <p className={cn("font-heading text-2xl font-medium tracking-tight tabular-nums", currentColor)}>
            {Math.round(current)}%
          </p>
          <p className="text-xs text-muted-foreground font-light">{getScoreLabel(current)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
              improved
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error"
            )}
          >
            {improved ? (
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            {improved ? "+" : ""}
            {Math.round(delta)} pts
          </span>
          {bestScore != null && (
            <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
              Best {Math.round(bestScore)}%
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Score trend chart"
      >
        <defs>
          <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD}
            x2={WIDTH - PAD}
            y1={HEIGHT * t}
            y2={HEIGHT * t}
            className="stroke-border"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
        ))}
        {areaPath && (
          <path d={areaPath} fill="url(#scoreTrendFill)" className="text-accent" />
        )}
        <path
          d={linePath}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="4"
          className="fill-accent"
          stroke="var(--background)"
          strokeWidth="2"
        />
      </svg>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-muted font-light">
          {firstDate ? formatDate(firstDate) : `${first}%`}
        </span>
        <span className="text-[11px] text-muted font-light">
          {lastDate ? formatDate(lastDate) : `${current}%`}
        </span>
      </div>
    </Card>
  );
}
