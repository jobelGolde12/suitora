"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Heart,
  TrendingUp,
  Plus,
  Camera,
  History,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  PageContainer,
  PageHeader,
  SectionTitle,
  MetricCard,
  QuickActionCard,
  AnalysisListItem,
  EmptyState,
  Sparkline,
  fadeInUp,
} from "@/components/dashboard";
import type { Analysis, DashboardStats } from "@/types";

const mockStats: DashboardStats = {
  totalAnalyses: 12,
  averageScore: 78,
  favoriteCount: 5,
  recentActivity: 3,
};

const mockRecentAnalyses: (Analysis & { isFavorite?: boolean })[] = [
  {
    id: "1",
    userId: "1",
    userImage: "/placeholder.svg",
    productImage: "/placeholder.svg",
    overallScore: 85,
    bodyScore: 82,
    styleScore: 88,
    colorScore: 79,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isFavorite: true,
  },
  {
    id: "2",
    userId: "1",
    userImage: "/placeholder.svg",
    productImage: "/placeholder.svg",
    overallScore: 62,
    bodyScore: 65,
    styleScore: 58,
    colorScore: 70,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isFavorite: false,
  },
  {
    id: "3",
    userId: "1",
    userImage: "/placeholder.svg",
    productImage: "/placeholder.svg",
    overallScore: 91,
    bodyScore: 93,
    styleScore: 90,
    colorScore: 88,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isFavorite: true,
  },
];

const scoreTrend = [72, 68, 75, 80, 78, 85, 82, 91];

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        label="Overview"
        title="Welcome back"
        description="Your fashion compatibility overview — calm metrics, recent fits, and a clear next step."
        action={
          <Link href="/upload">
            <Button variant="editorial" className="rounded-full px-6">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              New Analysis
            </Button>
          </Link>
        }
      />

      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={1}
        className="mb-12 grid gap-6 xl:grid-cols-[1.4fr_0.85fr]"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-card">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/20 via-transparent to-transparent" />
          <div className="relative">
            <span className="editorial-label">Style snapshot</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light tracking-tight text-balance mt-3">
              The calm dashboard for confident fashion choices.
            </h2>
            <p className="mt-4 text-sm text-muted font-light max-w-2xl leading-relaxed">
              Track your compatibility trends, revisit your best results, and begin your next analysis with clarity.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-xs text-muted uppercase tracking-[0.3em] mb-3">Average score</p>
              <p className="font-heading text-5xl font-light tracking-tight tabular-nums">{mockStats.averageScore}%</p>
              <p className="mt-3 text-sm text-muted font-light leading-relaxed">
                The average compatibility rating from your recent analyses.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-xs text-muted uppercase tracking-[0.3em] mb-3">Favorites</p>
              <p className="font-heading text-5xl font-light tracking-tight tabular-nums">{mockStats.favoriteCount}</p>
              <p className="mt-3 text-sm text-muted font-light leading-relaxed">
                Items you marked as the most flattering and worth saving.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
          className="rounded-[2rem] border border-border bg-card p-8 shadow-card"
        >
          <span className="editorial-label">Next step</span>
          <h3 className="font-heading text-2xl font-light tracking-tight mt-3">
            Start your next analysis
          </h3>
          <p className="mt-4 text-sm text-muted font-light leading-relaxed">
            Upload a new photo and clothing item, then let Suitora evaluate fit, color, and style in moments.
          </p>
          <Link href="/upload">
            <Button variant="editorial" className="mt-8 rounded-full px-6">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Start analysis
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
        <MetricCard
          icon={BarChart3}
          label="Total Analyses"
          value={mockStats.totalAnalyses}
          delay={3}
          sparklineData={[4, 6, 5, 8, 9, 10, 12]}
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg. Score"
          value={`${mockStats.averageScore}%`}
          delay={4}
          sparklineData={scoreTrend}
        />
        <MetricCard
          icon={Heart}
          label="Favorites"
          value={mockStats.favoriteCount}
          delay={5}
        />
        <MetricCard
          icon={Clock}
          label="This Week"
          value={mockStats.recentActivity}
          delay={6}
        />
      </div>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={7}
        className="mb-12"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            <SectionTitle title="Score trend" />
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="editorial-label mb-2">Compatibility</p>
                <p className="font-heading text-4xl font-light tracking-tight tabular-nums">
                  {mockStats.averageScore}%
                </p>
                <p className="text-sm text-muted font-light mt-2 max-w-sm leading-relaxed">
                  Average fit score across your recent analyses — higher is a stronger match.
                </p>
              </div>
              <div className="w-full sm:w-64 h-16 text-accent">
                <Sparkline data={scoreTrend} className="w-full h-full" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <p className="text-xs text-muted uppercase tracking-[0.3em] mb-3">What this means</p>
            <p className="font-medium text-lg">Your dashboard is tuned to your most recent style decisions.</p>
            <p className="mt-4 text-sm text-muted font-light leading-relaxed">
              Use these signals to compare new outfits, confirm your best matches, and keep your wardrobe aligned with your personal style.
            </p>
          </div>
        </div>
      </motion.section>

      <section className="mb-12">
        <SectionTitle title="Quick actions" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickActionCard
            href="/upload"
            icon={Camera}
            title="Upload Photo"
            description="Start a new analysis"
            delay={8}
          />
          <QuickActionCard
            href="/history"
            icon={History}
            title="View History"
            description="Browse past analyses"
            delay={9}
          />
          <QuickActionCard
            href="/settings"
            icon={Settings}
            title="Settings"
            description="Manage your account"
            delay={10}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="Recent analyses" href="/history" />

        {mockRecentAnalyses.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No analyses yet"
            description="Upload your first clothing item to see how it suits you."
            action={
              <Link href="/upload">
                <Button variant="editorial" className="rounded-full px-6">
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                  Start Analysis
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {mockRecentAnalyses.map((analysis, i) => (
              <AnalysisListItem
                key={analysis.id}
                id={analysis.id}
                overallScore={analysis.overallScore}
                createdAt={analysis.createdAt}
                isFavorite={analysis.isFavorite}
                delay={11 + i}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
