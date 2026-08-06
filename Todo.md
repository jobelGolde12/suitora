# Dashboard Display Performance Plan

## Goal

Make dashboard content appear faster while preserving the skeleton animation during loading. The skeleton stays as the initial render; the strategy focuses on reducing the time until meaningful content replaces it.

---

## 1. Parallelize Server-Side Data Fetching in `/api/dashboard/stats`

**Problem:** The stats endpoint runs 4 DB queries sequentially (stats → recent analyses → favorites → score trend), adding cumulative latency.

**Fix:** Execute independent queries in parallel with `Promise.all`. The score trend query (`getAnalysesByUserId(userId, 10)`) has no dependency on the other three and can run concurrently.

```ts
// Before (sequential):
const stats = await getDashboardStats(userId);
const recent = await getAnalysesByUserId(userId, 5);
const favorites = await getFavoritesByUserId(userId);
const trendAnalyses = await getAnalysesByUserId(userId, 10);

// After (parallel):
const [stats, recent, favorites, trendAnalyses] = await Promise.all([
  getDashboardStats(userId),
  getAnalysesByUserId(userId, 5),
  getFavoritesByUserId(userId),
  getAnalysesByUserId(userId, 10),
]);
```

**Impact:** Reduces worst-case latency from `sum(query times)` to `max(query times)`.

---

## 2. Eliminate the N+1 Favorites Lookup via JOIN

**Problem:** `getFavoritesByUserId` runs a full join between `favorites` and `analyses` just to check which analysis IDs are favorited. This is over-fetching.

**Fix:** Replace the join with a lightweight query that returns only `analysisId` values, or embed the `isFavorite` flag directly in the recent-analyses query using a SQL `CASE` expression.

```ts
// Option A: lightweight query returning only analysisIds
export async function getFavoriteAnalysisIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ analysisId: schema.favorites.analysisId })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId));
  return new Set(rows.map((r) => r.analysisId));
}

// Option B: embed in the recent-analyses query
// Add a SQL CASE expression to getAnalysesByUserId that flags favorited rows
```

**Impact:** Reduces data transfer and query complexity for the favorites check.

---

## 3. Implement Stale-While-Revalidate (SWR) on the Client

**Problem:** Every dashboard navigation triggers a full refetch of all data from scratch, even if cached data is still fresh.

**Fix:** Adopt SWR (or React Query) for client-side data fetching with a short stale-while-revalidate window. The skeleton remains visible on first load; subsequent navigations return cached data instantly while revalidating in the background.

```ts
// Use SWR with a 30-second revalidation interval
const { data, isLoading } = useSWR(
  "/api/dashboard/stats",
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30_000,
  }
);
```

**Impact:** Instant data display on back/forward navigation; skeleton only shown on cold load.

---

## 4. Stream Independent Dashboard Sections with React Suspense

**Problem:** The entire dashboard waits for all data before rendering. A slow `/api/wardrobe` call blocks the whole page.

**Fix:** Wrap independent sections in `React.Suspense` boundaries so they hydrate independently. The shell (skeleton) renders immediately; each section replaces its skeleton as its data resolves.

```tsx
// DashboardPage.tsx
export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <Suspense fallback={<ScoreTrendSkeleton />}>
        <ScoreTrendSection />
      </Suspense>
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection />
      </Suspense>
      <Suspense fallback={<AnalysesSkeleton />}>
        <RecentAnalysesSection />
      </Suspense>
    </PageContainer>
  );
}
```

Each section becomes a separate client component that fetches its own data. The skeleton for each section is shown only while that section's data is loading.

**Impact:** Users see content progressively as each section resolves; no single slow endpoint blocks the entire page.

---

## 5. Deduplicate the `/api/wardrobe` Call

**Problem:** The dashboard fetches `/api/wardrobe` solely for the item count, but that endpoint also fetches folders, folder counts, and favorites — far more data than needed.

**Fix:** Add a lightweight `GET /api/wardrobe/count` endpoint that returns only `{ count: number }`, or include the count in the `/api/dashboard/stats` response so the dashboard page makes one fewer request.

```ts
// Option A: Add count to dashboard stats response
return NextResponse.json({
  stats,
  recentAnalyses: recentAnalysesWithFavorite,
  scoreTrend: finalScoreTrend,
  trendDates,
  bestScore,
  userName,
  wardrobeCount: wardrobeRows.length, // from stylist route
});

// Option B: Dedicated lightweight endpoint
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const count = await getWardrobeItemCount(session.user.id);
  return NextResponse.json({ count });
}
```

**Impact:** Reduces payload size and eliminates an unnecessary parallel request.

---

## 6. Preload Data on Interactive Element Hover

**Problem:** Data is only fetched after the page renders, adding latency before content appears.

**Fix:** Use `link` component `prefetch` or a custom hover handler to trigger data fetching before navigation. For the dashboard, prefetch the `/api/dashboard/stats` and `/api/wardrobe` responses when the user hovers over the dashboard link in the nav.

```tsx
// In the nav component
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>

// Or programmatically via a custom hook
function usePrefetchDashboard() {
  const router = useRouter();
  return (
    <Link
      href="/dashboard"
      onMouseEnter={() => {
        void fetch("/api/dashboard/stats", { credentials: "include" });
        void fetch("/api/wardrobe", { credentials: "include" });
      }}
    >
      Dashboard
    </Link>
  );
}
```

**Impact:** Data is already in the browser cache by the time the user navigates to the dashboard.

---

## 7. Optimize the Trending Items Client-Side Fetch

**Problem:** Trending items are fetched in a separate `useEffect` after the main dashboard data, adding to the total time-to-interactive.

**Fix:** Fetch trending items in parallel with the main dashboard data using the same `Promise.all` pattern, or move the trending fetch into the `/api/dashboard/stats` endpoint so it's a single request.

```tsx
// Before: two separate effects
useEffect(() => { void loadStats(); }, []);
useEffect(() => { void loadTrending(); }, []);

// After: single effect with parallel fetches
useEffect(() => {
  void Promise.all([loadStats(), loadTrending()]);
}, []);
```

**Impact:** Trending data starts loading at the same time as dashboard stats, reducing total fetch time.

---

## 8. Add `React.cache()` for Server-Side Data Deduplication

**Problem:** If multiple server components or route handlers request the same data within a single request, each invocation hits the database independently.

**Fix:** Wrap frequently-used queries with `React.cache()` (from `react`) so that within a single request, the same query is only executed once and the result is shared.

```ts
import { cache } from "react";

export const getDashboardStats = cache(async (userId: string) => {
  // This will only execute once per request, even if called multiple times
  const [stats] = await db.select(...).from(schema.analyses).where(...);
  return stats;
});
```

**Impact:** Eliminates redundant database round-trips within a single request lifecycle.

---

## Summary of Expected Improvements

| Strategy | Latency Reduction | Complexity |
|---|---|---|
| Parallelize DB queries in stats endpoint | ~40-60% of sequential time | Low |
| Eliminate N+1 favorites lookup | ~1 query eliminated | Low |
| SWR client-side caching | Instant on revisit | Medium |
| React Suspense streaming | Progressive rendering | Medium |
| Deduplicate wardrobe call | 1 request eliminated | Low |
| Prefetch on hover | Near-zero on navigation | Low |
| Parallel trending fetch | ~1 round-trip saved | Low |
| `React.cache()` dedup | Eliminates redundant queries | Low |

All strategies preserve the skeleton animation — the skeleton is the initial render state, and content replaces it as data resolves faster.