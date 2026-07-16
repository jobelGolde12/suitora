"use client";

import type { ElementType } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "./motion";
import { Sparkline } from "./Sparkline";

interface MetricCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  delay?: number;
  sparklineData?: number[];
  className?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  delay = 0,
  sparklineData,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-card editorial-card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
          <Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} className="w-16 h-8 opacity-80" />
        )}
      </div>
      <div className="mt-5">
        <p className="font-heading text-3xl font-light tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted mt-1.5 font-light">{label}</p>
      </div>
    </motion.div>
  );
}
