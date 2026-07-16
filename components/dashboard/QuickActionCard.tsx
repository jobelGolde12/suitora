"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "./motion";

interface QuickActionCardProps {
  href: string;
  icon: ElementType;
  title: string;
  description: string;
  delay?: number;
  className?: string;
}

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  delay = 0,
  className,
}: QuickActionCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 210, damping: 20 }}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-card",
          "editorial-card-hover group",
          className
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors duration-200 group-hover:border-accent/40 group-hover:bg-accent/5">
          <Icon className="h-4 w-4 text-muted group-hover:text-accent transition-colors duration-200" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted font-light mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted/50 group-hover:text-foreground transition-colors duration-200 shrink-0" />
      </Link>
    </motion.div>
  );
}
