/**
 * Shared analysis helpers used by multiple dashboard pages.
 */

import type { AnalysisResult } from "@/types";

/**
 * Extract the clothing category from an analysis's compatibility metadata.
 * Returns null when the metadata is missing or doesn't contain a category.
 */
export function extractCategory(
  analysis: AnalysisResult
): string | null {
  if (!analysis.compatibilityMetadata) return null;
  try {
    const meta = analysis.compatibilityMetadata as {
      itemProfile?: { category?: string };
    } | null;
    return meta?.itemProfile?.category ?? null;
  } catch {
    return null;
  }
}
