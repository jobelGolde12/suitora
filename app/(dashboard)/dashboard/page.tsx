"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Clock,
  Heart,
  TrendingUp,
  ArrowRight,
  Plus,
  Camera,
  Shirt,
  History,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, formatScore, getScoreColor } from "@/lib/utils/format";
import type { Analysis, DashboardStats } from "@/types";

// Mock data for the dashboard
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

const easeInOutQuad: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: easeInOutQuad },
  }),
};

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={delay}
      className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted mt-1">Welcome back! Here&apos;s your fashion overview.</p>
          </div>
          <Link href="/upload">
            <Button>
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BarChart3}
            label="Total Analyses"
            value={mockStats.totalAnalyses}
            gradient="from-primary to-accent"
            delay={0}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg. Score"
            value={`${mockStats.averageScore}%`}
            gradient="from-success to-emerald-500"
            delay={1}
          />
          <StatCard
            icon={Heart}
            label="Favorites"
            value={mockStats.favoriteCount}
            gradient="from-rose-500 to-pink-500"
            delay={2}
          />
          <StatCard
            icon={Clock}
            label="This Week"
            value={mockStats.recentActivity}
            gradient="from-orange-500 to-amber-500"
            delay={3}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={4}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/upload">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm group-hover:scale-105 transition-transform">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Upload Photo</p>
                  <p className="text-xs text-muted">Start a new analysis</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </div>
            </Link>
            <Link href="/history">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-accent/30 transition-all duration-300 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500 shadow-sm group-hover:scale-105 transition-transform">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">View History</p>
                  <p className="text-xs text-muted">Browse past analyses</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
              </div>
            </Link>
            <Link href="/settings">
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-muted-foreground/30 transition-all duration-300 group cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted-foreground shadow-sm group-hover:scale-105 transition-transform">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Settings</p>
                  <p className="text-xs text-muted">Manage your account</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Analyses */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={5}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Analyses</h2>
            <Link href="/history" className="text-xs text-muted hover:text-primary transition-colors">
              View all
            </Link>
          </div>

          {mockRecentAnalyses.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="font-medium text-muted">No analyses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your first clothing item to get started
                  </p>
                  <Link href="/upload">
                    <Button variant="secondary" className="mt-4">
                      <Plus className="h-4 w-4" />
                      Start Analysis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mockRecentAnalyses.map((analysis, i) => (
                <Link key={analysis.id} href={`/results/${analysis.id}`}>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    custom={6 + i}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elevated hover:border-border/80 transition-all duration-300 cursor-pointer"
                  >
                    {/* Score */}
                    <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-surface flex items-center justify-center border border-border">
                      <span className={`text-lg font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {formatScore(analysis.overallScore)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Shirt className="h-4 w-4 text-muted" />
                        <p className="text-sm font-medium truncate">Clothing Analysis</p>
                        {analysis.isFavorite && (
                          <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant={analysis.overallScore >= 70 ? "success" : "warning"}>
                          {analysis.overallScore >= 70 ? "Good Match" : "Average"}
                        </Badge>
                        <span className="text-xs text-muted">
                          {formatRelativeTime(analysis.createdAt)}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted flex-shrink-0" />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
