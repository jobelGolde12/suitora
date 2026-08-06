"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  TrendingUp,
  Plus,
  Camera,
  History,
  Settings,
  Sparkles,
  Shirt,
  MessageCircle,
  GitCompareArrows,
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
  ScoreTrendCard,
  ContextualTips,
  SeasonalTipCard,
  DashboardSkeleton,
} from "@/components/dashboard";
import { OutfitSuggestions } from "@/components/wardrobe/OutfitSuggestions";
import { TrendingCollection } from "@/components/trending";
import { getCurrentSeason } from "@/lib/season";
import type { AnalysisResult, DashboardStats } from "@/types";
import type { TrendItem } from "@/types/trend";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch");
    }
    return res.json();
  });

export default function DashboardPage() {
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useSWR<{ stats: DashboardStats; recentAnalyses: AnalysisResult[]; scoreTrend: number[]; trendDates: string[]; bestScore: number | null; userName: string | null }>(
    "/api/dashboard/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000, // 30 seconds
    }
  );

  const {
    data: trendingData,
    isLoading: trendingLoading,
  } = useSWR<{ items: TrendItem[] }>(
    "/api/trending?limit=8",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
    }
  );

  const isLoading = statsLoading || trendingLoading;

  const stats = statsData?.stats;
  const recentAnalyses = statsData?.recentAnalyses ?? [];
  const scoreTrend = statsData?.scoreTrend ?? [];
  const trendDates = statsData?.trendDates ?? [];
  const bestScore = statsData?.bestScore ?? null;
  const userName = statsData?.userName ?? null;
  const wardrobeCount = statsData?.stats?.wardrobeCount ?? 0;
  const trendingItems = trendingData?.items ?? [];
  const trendingLoadingState = trendingLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const activeStats = stats || {
    totalAnalyses: 0,
    averageScore: 0,
    favoriteCount: 0,
    recentActivity: 0,
    wardrobeCount: 0,
    tryOn: {
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      processing: 0,
      failureRate: null,
      avgLatencyMs: null,
    },
  };

  const activeScoreTrend = scoreTrend.length > 0 ? scoreTrend : [0];
  const tryOn = activeStats.tryOn;
  const tryOnSuccessRate =
    tryOn.failureRate != null ? Math.round(100 - tryOn.failureRate) : null;
  const tryOnLatencyLabel =
    tryOn.avgLatencyMs != null
      ? tryOn.avgLatencyMs >= 1000
        ? `${(tryOn.avgLatencyMs / 1000).toFixed(1)}s avg`
        : `${tryOn.avgLatencyMs}ms avg`
      : null;

  const season = getCurrentSeason();
  const greeting = userName ? `Welcome back, ${userName}` : "Welcome back";

  return (
    <PageContainer>
      <PageHeader
        label="Overview"
        title={greeting}
        description={`${season.label} edit — your fashion compatibility at a glance. Start a new analysis or revisit recent results.`}
        action={
          <Link href="/upload">
            <Button variant="editorial" className="rounded-full px-6">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Try It On
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
        <ScoreTrendCard
          data={activeScoreTrend}
          dates={trendDates}
          bestScore={bestScore}
          className="lg:col-span-2"
        />
        <div className="space-y-4">
          <ContextualTips stats={activeStats} wardrobeCount={wardrobeCount} />
          <SeasonalTipCard skinTone={null} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
        <MetricCard
          icon={BarChart3}
          label="Total Analyses"
          value={activeStats.totalAnalyses}
          sparklineData={activeScoreTrend}
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg. Score"
          value={`${activeStats.averageScore}%`}
          sparklineData={activeScoreTrend}
        />
        <MetricCard
          icon={Shirt}
          label="Wardrobe"
          value={wardrobeCount || activeStats.favoriteCount}
        />
        <MetricCard
          icon={Clock}
          label="This Week"
          value={activeStats.recentActivity}
        />
      </div>

      {tryOn.total > 0 && tryOnSuccessRate != null && (
        <section className="mb-12">
          <SectionTitle title="Virtual try-on" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <MetricCard
              icon={Shirt}
              label={
                tryOn.failed > 0
                  ? `Success rate · ${tryOn.failed} soft-failed`
                  : "Success rate"
              }
              value={`${tryOnSuccessRate}%`}
            />
            <MetricCard
              icon={Sparkles}
              label={
                tryOnLatencyLabel
                  ? "Avg. generation time"
                  : tryOn.processing > 0
                    ? "Currently generating"
                    : "Previews completed"
              }
              value={
                tryOnLatencyLabel
                  ? tryOnLatencyLabel.replace(" avg", "")
                  : tryOn.processing > 0
                    ? tryOn.processing
                    : tryOn.completed
              }
            />
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionTitle title="Quick actions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            href="/upload"
            icon={Camera}
            title="Upload Photo"
            description="Start a new analysis"
          />
          <QuickActionCard
            href="/wardrobe"
            icon={Shirt}
            title="Wardrobe"
            description="Organize pieces & outfits"
          />
          <QuickActionCard
            href="/stylist"
            icon={MessageCircle}
            title="AI Stylist"
            description="Get personalized advice"
          />
          <QuickActionCard
            href="/compare"
            icon={GitCompareArrows}
            title="Compare"
            description="Stack your results side by side"
          />
          <QuickActionCard
            href="/trending"
            icon={Sparkles}
            title="Trending"
            description="Explore fashion picks"
          />
          <QuickActionCard
            href="/history"
            icon={History}
            title="View History"
            description="Browse past analyses"
          />
          <QuickActionCard
            href="/settings"
            icon={Settings}
            title="Settings"
            description="Manage your account"
          />
        </div>
      </section>

      <OutfitSuggestions wardrobeCount={wardrobeCount} />

      <section className="mb-12">
        <SectionTitle title="Recent analyses" href="/history" />

        {recentAnalyses.length === 0 ? (
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
            {recentAnalyses.map((analysis) => (
              <AnalysisListItem
                key={analysis.id}
                id={analysis.id}
                overallScore={analysis.overallScore}
                createdAt={analysis.createdAt}
                isFavorite={analysis.isFavorite}
              />
            ))}
          </div>
        )}
      </section>

      <TrendingCollection
        title="Trending items"
        items={trendingItems}
        isLoading={trendingLoadingState}
        layout="carousel"
        href="/trending"
      />
    </PageContainer>
  );
}