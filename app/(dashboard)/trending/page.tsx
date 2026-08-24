"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "@/components/dashboard";
import {
  TrendingFilters,
  TrendingGrid,
  TrendingGridSkeleton,
} from "@/components/trending";
import { fetcher } from "@/lib/utils/fetcher";
import type { TrendItem } from "@/types/trend";

export default function TrendingPage() {
  const [category, setCategory] = useState("all");

  const params = new URLSearchParams({ limit: "24" });
  if (category && category !== "all") {
    params.set("category", category);
  }

  const {
    data,
    isLoading,
    error,
    mutate,
  } = useSWR<{ items: TrendItem[] }>(
    `/api/trending?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
    }
  );

  const items = data?.items ?? [];
  const loadError = !!error;

  return (
    <PageContainer>
      <PageHeader
        label="Discover"
        title="Trending Items"
        description="Curated fashion picks synchronized from online sources — explore, analyze, and complete the look."
      />

      <div className="mb-8">
        <TrendingFilters
          activeCategory={category}
          onCategoryChange={setCategory}
        />
      </div>

      {loadError ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load trending items"
          description="Something went wrong while fetching the trending feed. Check your connection and try again."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="editorial"
                className="rounded-full px-6"
                onClick={() => void mutate()}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                Retry
              </Button>
              <Link href="/upload">
                <Button variant="secondary" className="rounded-full px-6">
                  Analyze your own item
                </Button>
              </Link>
            </div>
          }
        />
      ) : isLoading ? (
        <TrendingGridSkeleton count={8} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No trending items"
          description="Nothing matches this filter yet. Try another category or check back after the next sync."
          action={
            <Link href="/upload">
              <Button variant="editorial" className="rounded-full px-6">
                Analyze your own item
              </Button>
            </Link>
          }
        />
      ) : (
        <TrendingGrid items={items} />
      )}
    </PageContainer>
  );
}
