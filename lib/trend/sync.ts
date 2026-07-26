/**
 * Synchronization pipeline:
 * fetch → normalize → upsert → log → invalidate cache
 */

import {
  countTrendItems,
  createTrendSyncLog,
  upsertTrendItem,
} from "@/lib/db/queries";
import { invalidateTrendCache } from "./cache";
import { fetchAllProviders } from "./fetch";
import { normalizeProduct } from "./normalize";

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

  for (const result of results) {
    if (result.error) {
      errors.push(`${result.provider}: ${result.error}`);
    }

    itemsFetched += result.products.length;
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
