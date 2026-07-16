import { cn } from "@/lib/utils/cn";

interface SparklineProps {
  data: number[];
  className?: string;
  stroke?: string;
}

/** Lightweight SVG sparkline — no chart library */
export function Sparkline({
  data,
  className,
  stroke = "currentColor",
}: SparklineProps) {
  if (data.length < 2) return null;

  const width = 64;
  const height = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("text-accent", className)}
      aria-hidden
      fill="none"
    >
      <polyline
        points={points}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
