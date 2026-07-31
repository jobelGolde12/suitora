import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "./PageContainer";

export function DashboardSkeleton() {
  return (
    <PageContainer>
      {/* PageHeader skeleton */}
      <div className="mb-10">
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Hero section: style snapshot + next step */}
      <div className="mb-12 grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-card">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full max-w-xl mb-10" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-12 w-20 mb-3" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-12 w-12 mb-3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-card">
          <Skeleton className="h-3 w-20 mb-4" />
          <Skeleton className="h-7 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-8" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
            <div className="mt-5">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Score trend + info */}
      <div className="mb-12 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          <Skeleton className="h-3 w-20 mb-4" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-3 w-64 mt-3" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <Skeleton className="h-3 w-28 mb-3" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-4" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-12">
        <Skeleton className="h-3 w-24 mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <Skeleton className="h-10 w-10 rounded-full mb-4" />
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent analyses */}
      <div>
        <Skeleton className="h-3 w-32 mb-5" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-3 w-20 mt-0.5" />
                </div>
              </div>
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

export function HistorySkeleton() {
  return (
    <PageContainer>
      {/* PageHeader skeleton */}
      <div className="mb-10">
        <Skeleton className="h-3 w-12 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-52 max-w-full" />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
        <Skeleton className="h-11 w-full max-w-md rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>

      {/* Analysis list items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-20 mt-0.5" />
              </div>
            </div>
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export function FavoritesSkeleton() {
  return (
    <PageContainer>
      {/* PageHeader skeleton */}
      <div className="mb-10">
        <Skeleton className="h-3 w-12 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
        ))}
      </div>

      {/* Favorites grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-card"
          >
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="p-5">
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-3 w-20 mt-2.5" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export function ResultsSkeleton() {
  return (
    <PageContainer>
      {/* Back button */}
      <Skeleton className="h-4 w-16 mb-6" />

      {/* PageHeader */}
      <div className="mb-10">
        <Skeleton className="h-3 w-14 mb-3" />
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        {/* Left column: images + scores */}
        <div className="lg:col-span-3 space-y-8">
          {/* Product image card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
          </div>

          {/* Score breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
            <Skeleton className="h-3 w-28 mb-6" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-4 text-center">
                  <Skeleton className="h-3 w-12 mx-auto mb-2" />
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: traits + metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall score circle */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col items-center">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Body traits */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <Skeleton className="h-3 w-20 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <Skeleton className="h-3 w-28 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <Skeleton className="h-3 w-28 mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export function UploadSkeleton() {
  return (
    <PageContainer narrow>
      {/* PageHeader */}
      <div className="mb-10">
        <Skeleton className="h-3 w-12 mb-3" />
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
        {/* Self-image column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
        </div>

        {/* Clothing input column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Mode tabs */}
          <div className="flex border border-border rounded-xl p-1 bg-surface/50 mb-4">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
          <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
        </div>
      </div>

      {/* Analyze button */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-56 rounded-full" />
      </div>
    </PageContainer>
  );
}
