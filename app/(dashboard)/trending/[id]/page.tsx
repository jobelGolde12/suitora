"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Camera,
  Heart,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import {
  PageContainer,
  PageHeader,
  SectionTitle,
  fadeInUp,
} from "@/components/dashboard";
import { TrendingGrid } from "@/components/trending";
import { getCategoryCropClass } from "@/config/category-display";
import { cn } from "@/lib/utils/cn";
import type { TrendItem } from "@/types/trend";

export default function TrendingItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<TrendItem | null>(null);
  const [similar, setSimilar] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/trending/${id}`, {
          credentials: "include",
        });
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load item");
        const data = await res.json();
        setItem(data.item);
        setSimilar(data.similar || []);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted font-light">Loading item…</p>
        </div>
      </PageContainer>
    );
  }

  if (notFound || !item) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle className="h-10 w-10 text-error" />
          <h2 className="font-heading text-2xl font-light">Item not found</h2>
          <Link href="/trending">
            <Button variant="editorial" className="rounded-full">
              Back to trending
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const priceLabel =
    item.price != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: item.currency || "USD",
          maximumFractionDigits: 0,
        }).format(item.price)
      : null;

  const cropClass = getCategoryCropClass(item.category);

  return (
    <PageContainer>
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/trending")}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Trending
        </button>
      </motion.div>

      <PageHeader
        label="Trending item"
        title={item.title}
        description={
          item.description ||
          "Explore this piece, analyze fit compatibility, or save it for later."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={1}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
            cropClass
          )}
        >
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            unoptimized
            priority
          />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
          className="space-y-6"
        >
          <div className="space-y-3">
            {item.brand && (
              <p className="text-xs uppercase tracking-[0.25em] text-muted font-light">
                {item.brand}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={item.category} size="md" />
              {item.season && (
                <Badge variant="default" className="capitalize">
                  {item.season}
                </Badge>
              )}
              {item.occasion && (
                <Badge variant="accent" className="capitalize">
                  {item.occasion}
                </Badge>
              )}
              {item.isFeatured && <Badge variant="primary">Featured</Badge>}
            </div>
            {priceLabel && (
              <p className="font-heading text-3xl font-light tracking-tight tabular-nums">
                {priceLabel}
              </p>
            )}
            <p className="text-sm text-muted font-light leading-relaxed">
              Popularity score{" "}
              <span className="text-foreground tabular-nums font-medium">
                {Math.round(item.popularityScore)}
              </span>
              {item.subcategory && (
                <>
                  {" "}
                  · {item.subcategory.replace(/_/g, " ")}
                </>
              )}
            </p>
          </div>

          {item.styleTags.length > 0 && (
            <div>
              <p className="editorial-label mb-2">Style tags</p>
              <div className="flex flex-wrap gap-2">
                {item.styleTags.map((tag) => (
                  <Badge key={tag} variant="default" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {item.colors.length > 0 && (
            <div>
              <p className="editorial-label mb-2">Colors</p>
              <div className="flex flex-wrap gap-2">
                {item.colors.map((color) => (
                  <span
                    key={color}
                    className="h-7 w-7 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <p className="editorial-label">What you can do</p>
            <p className="text-sm text-muted font-light leading-relaxed">
              Run a body-fit analysis on a similar look, open the product page, or
              return to the full trending collection.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/upload">
                <Button variant="editorial" className="rounded-full px-5">
                  <Camera className="h-4 w-4" strokeWidth={1.5} />
                  Analyze this style
                </Button>
              </Link>
              {item.productUrl && (
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" className="rounded-full px-5">
                    <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                    Product page
                  </Button>
                </a>
              )}
              <Link href="/favorites">
                <Button variant="ghost" className="rounded-full px-5">
                  <Heart className="h-4 w-4" strokeWidth={1.5} />
                  Favorites
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <section>
        <SectionTitle title="Similar items" />
        {similar.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Sparkles className="h-6 w-6 text-muted mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted font-light">
              No similar items in this category yet.
            </p>
          </div>
        ) : (
          <TrendingGrid items={similar} />
        )}
      </section>
    </PageContainer>
  );
}
