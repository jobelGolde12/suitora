import { cn } from "@/lib/utils/cn";
import { getScoreColor } from "@/lib/utils/format";

interface ScoreBarProps {
  label: string;
  score: number;
  className?: string;
}

export function ScoreBar({ label, score, className }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const colorClass = getScoreColor(clamped);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted font-light">{label}</span>
        <span className={cn("text-sm font-medium tabular-nums", colorClass)}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            clamped >= 80
              ? "bg-success"
              : clamped >= 60
                ? "bg-warning"
                : "bg-error"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
