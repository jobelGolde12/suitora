"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "./motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  label,
  action,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10",
        className
      )}
    >
      <div className="space-y-2 min-w-0">
        {label && <span className="editorial-label">{label}</span>}
        <h1 className="font-heading text-3xl sm:text-4xl font-light tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-muted font-light leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </motion.div>
  );
}
