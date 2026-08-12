"use client";

import Link from "next/link";
import {
  Camera,
  Heart,
  Lightbulb,
  MessageCircle,
  GitCompareArrows,
  TrendingDown,
  Shirt,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DashboardStats } from "@/types";

interface ContextualTipsProps {
  stats: DashboardStats;
  wardrobeCount?: number;
}

interface Tip {
  icon: typeof Lightbulb;
  text: string;
  href?: string;
}

export function ContextualTips({ stats, wardrobeCount }: ContextualTipsProps) {
  const { totalAnalyses, averageScore, favoriteCount, recentActivity, tryOn } =
    stats;
  const tips: Tip[] = [];

  if (totalAnalyses === 0) {
    tips.push({
      icon: Camera,
      text: "Run your first analysis to see how clothes suit you.",
      href: "/upload",
    });
  } else if (totalAnalyses === 1) {
    tips.push({
      icon: Camera,
      text: "One analysis is a start — add more to unlock reliable recommendations.",
      href: "/upload",
    });
  } else if (totalAnalyses >= 5) {
    tips.push({
      icon: Lightbulb,
      text: "You have a solid dataset — compare picks to spot what works best for you.",
      href: "/compare",
    });
  }

  if (totalAnalyses > 0 && averageScore < 60) {
    tips.push({
      icon: TrendingDown,
      text: "Your picks average below 60% — ask the stylist for colors and cuts that fit you better.",
      href: "/stylist",
    });
  } else if (totalAnalyses >= 3 && averageScore >= 80) {
    tips.push({
      icon: Lightbulb,
      text: "Strong consistency — you clearly know what suits you. Keep it up!",
    });
  }

  if (totalAnalyses > 0 && favoriteCount === 0) {
    tips.push({
      icon: Heart,
      text: "Save your best finds to favorites and build your personal wardrobe.",
      href: "/favorites",
    });
  } else if (favoriteCount >= 3 && (wardrobeCount ?? 0) === 0) {
    tips.push({
      icon: Shirt,
      text: "You have favorites — add a few to your wardrobe to unlock outfit ideas.",
      href: "/wardrobe",
    });
  } else if (favoriteCount >= 3) {
    tips.push({
      icon: Heart,
      text: `You've saved ${favoriteCount} favorites — revisit them for styling ideas.`,
      href: "/favorites",
    });
  }

  if ((wardrobeCount ?? 0) === 0 && favoriteCount > 0) {
    tips.push({
      icon: Shirt,
      text: "Your wardrobe is empty — organize favorites into folders for better outfit suggestions.",
      href: "/wardrobe",
    });
  }

  if (recentActivity === 0 && totalAnalyses > 0) {
    tips.push({
      icon: Lightbulb,
      text: "Nothing analyzed this week — a quick look keeps your recommendations fresh.",
      href: "/upload",
    });
  }

  if (tryOn.failureRate != null && tryOn.failureRate > 30) {
    tips.push({
      icon: Shirt,
      text: "Virtual try-on is struggling — try a well-lit, front-facing photo for better previews.",
      href: "/upload",
    });
  }

  tips.push({
    icon: MessageCircle,
    text: "Ask the AI stylist for outfit ideas or color advice anytime.",
    href: "/stylist",
  });

  if (totalAnalyses >= 2) {
    tips.push({
      icon: GitCompareArrows,
      text: "Compare your past analyses side by side to find your best matches.",
      href: "/compare",
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted mb-4">
        <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.5} />
        Suggestions
      </p>
      <ul className="space-y-3">
        {tips.slice(0, 5).map((tip, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-foreground font-light"
          >
            {tip.href ? (
              <Link
                href={tip.href}
                className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-0.5 transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <tip.icon
                  className="h-4 w-4 text-accent shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <span>{tip.text}</span>
              </Link>
            ) : (
              <>
                <tip.icon
                  className="h-4 w-4 text-accent shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <span>{tip.text}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
