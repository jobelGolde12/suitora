"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import type { TrendItem } from "@/types/trend";

export default function TrendingPage() {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [category, setCategory] = useState("all");

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (category && category !== "all") {
        params.set("category", category);
      }
      const res = await fetch(`/api/trending?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load trending items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load trending items:", err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

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
            <Button
              variant="editorial"
              className="rounded-full px-6"
              onClick={() => void load()}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              Retry
            </Button>
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
