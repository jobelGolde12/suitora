"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
  const [category, setCategory] = useState("all");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "24" });
        if (category && category !== "all") {
          params.set("category", category);
        }
        const res = await fetch(`/api/trending?${params.toString()}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("Failed to load trending items:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [category]);

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

      {isLoading ? (
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
