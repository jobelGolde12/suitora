"use client";

import { Leaf } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getCurrentSeason, getSeasonalTip } from "@/lib/season";
import type { SkinTone } from "@/types";

interface SeasonalTipCardProps {
  skinTone?: SkinTone | null;
  className?: string;
}

export function SeasonalTipCard({ skinTone, className }: SeasonalTipCardProps) {
  const season = getCurrentSeason();
  const tip = getSeasonalTip(season, skinTone);

  return (
    <Card className={className ? `p-5 sm:p-6 ${className}` : "p-5 sm:p-6"}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted mb-3">
        <Leaf className="h-3.5 w-3.5" strokeWidth={1.5} />
        {season.label} edit
      </p>
      <p className="text-sm text-foreground font-light leading-relaxed">{tip}</p>
    </Card>
  );
}
