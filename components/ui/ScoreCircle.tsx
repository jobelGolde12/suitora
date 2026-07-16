"use client";

import { cn } from "@/lib/utils/cn";
import { getScoreColor, getScoreLabel } from "@/lib/utils/format";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const dimensions = {
  sm: { size: 80, stroke: 6, fontSize: "text-lg" },
  md: { size: 120, stroke: 8, fontSize: "text-2xl" },
  lg: { size: 160, stroke: 10, fontSize: "text-3xl" },
} as const;

export function ScoreCircle({
  score,
  size = "md",
  label,
  showLabel = true,
  className,
}: ScoreCircleProps) {
  const { size: circleSize, stroke, fontSize } = dimensions[size];
  const radius = (circleSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = getScoreColor(score);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        <svg
          width={circleSize}
          height={circleSize}
          className="-rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-border/50"
          />
          {/* Progress circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-1000 ease-out", scoreColor)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-heading font-medium tracking-tight", fontSize, scoreColor)}>
            {score}%
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col items-center gap-0.5">
          {label && <span className="text-xs font-medium text-muted">{label}</span>}
          <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
        </div>
      )}
    </div>
  );
}
