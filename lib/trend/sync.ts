/**
 * Synchronization pipeline:
 * fetch → normalize → upsert → log → invalidate cache
 *
 * Optional post-processing:
 * - Affiliate enrichment (wraps product URLs with tracking)
 */

import {
  countTrendItems,
  createTrendSyncLog,
  getLastTrendSyncAt,
  upsertTrendItem,
} from "@/lib/db/queries";
import { invalidateTrendCache } from "./cache";
import { fetchAllProviders, fetchFromProvider } from "./fetch";
import { normalizeProduct } from "./normalize";
import type { RawProviderProduct } from "@/types/trend";

export interface SyncResult {
  providers: number;
  itemsFetched: number;
  itemsUpserted: number;
  errors: string[];
}

export async function syncTrendItems(): Promise<SyncResult> {
  const results = await fetchAllProviders();
  let itemsFetched = 0;
  let itemsUpserted = 0;
  const errors: string[] = [];

  // Collect all products for optional affiliate enrichment
  const allProducts: { provider: string; products: RawProviderProduct[] }[] = [];

  for (const result of results) {
    if (result.error) {
      errors.push(`${result.provider}: ${result.error}`);
    }

    itemsFetched += result.products.length;
    allProducts.push(result);

    let upsertedForProvider = 0;

    // Deduplicate within this batch by providerId
    const seen = new Set<string>();
    for (const raw of result.products) {
      if (seen.has(raw.providerId)) continue;
      seen.add(raw.providerId);

      try {
        const normalized = normalizeProduct(result.provider, raw);
        await upsertTrendItem(normalized);
        upsertedForProvider += 1;
        itemsUpserted += 1;
      } catch (err) {
        errors.push(
          `${result.provider}/${raw.providerId}: ${
            err instanceof Error ? err.message : "upsert failed"
          }`
        );
      }
    }

    await createTrendSyncLog({
      provider: result.provider,
      status: result.error
        ? result.products.length > 0
          ? "partial"
          : "failed"
        : "success",
      itemsFetched: result.products.length,
      itemsUpserted: upsertedForProvider,
      message: result.error,
    });
  }

  // Post-processing: Affiliate enrichment
  const affiliateApiKey = process.env.TREND_AFFILIATE_API_KEY;
  if (affiliateApiKey) {
    try {
      const affiliateResult = await fetchFromProvider("affiliate");
      if (affiliateResult.products.length === 0) {
        // Affiliate provider returns empty — enrich existing products
        const sourceProducts = allProducts.flatMap((r) => r.products);
        if (sourceProducts.length > 0) {
          const { fetchAffiliateProducts } = await import("./providers/affiliate");
          const enriched = await fetchAffiliateProducts(sourceProducts, affiliateApiKey);

          // Re-upsert enriched products with affiliate URLs
          let enrichedCount = 0;
          for (const raw of enriched) {
            if (!raw.productUrl?.includes("skim")) continue;
            try {
              const normalized = normalizeProduct("affiliate", raw);
              await upsertTrendItem(normalized);
              enrichedCount += 1;
            } catch {
              // Skip failed enrichment silently
            }
          }

          if (enrichedCount > 0) {
            await createTrendSyncLog({
              provider: "affiliate",
              status: "success",
              itemsFetched: enriched.length,
              itemsUpserted: enrichedCount,
              message: `Enriched ${enrichedCount} products with affiliate links`,
            });
            itemsUpserted += enrichedCount;
          }
        }
      }
    } catch (err) {
      errors.push(
        `affiliate: ${err instanceof Error ? err.message : "enrichment failed"}`
      );
    }
  }

  invalidateTrendCache();

  return {
    providers: results.length,
    itemsFetched,
    itemsUpserted,
    errors,
  };
}

/**
 * Ensure the trend_items table has data.
 * Seeds from curated provider when empty (first dashboard load).
 */
export async function ensureTrendItemsSeeded(): Promise<void> {
  try {
    const count = await countTrendItems();
    if (count > 0) return;
    await syncTrendItems();
  } catch (err) {
    // Table may not exist yet — log and continue with empty list
    console.error("ensureTrendItemsSeeded failed:", err);
  }
}

let refreshInFlight: Promise<void> | null = null;

/**
 * Kick off a live provider refresh when the cached trend data is stale.
 * Fire-and-forget: the current request is served from the DB while the
 * sync runs in the background, so the next request sees fresh items.
 * Guards against concurrent syncs (in-memory lock).
 */
export async function maybeRefreshTrendItems(
  maxAgeMs = 6 * 60 * 60 * 1000 // 6 hours
): Promise<boolean> {
  try {
    const lastSync = await getLastTrendSyncAt();
    if (lastSync && Date.now() - lastSync.getTime() < maxAgeMs) {
      return false;
    }
    if (refreshInFlight) {
      return true;
    }
    refreshInFlight = syncTrendItems()
      .catch((err) =>
        console.error("[trend] background refresh failed:", err)
      )
      .then(() => {
        refreshInFlight = null;
      });
    return true;
  } catch (err) {
    console.error("maybeRefreshTrendItems failed:", err);
    return false;
  }
}
