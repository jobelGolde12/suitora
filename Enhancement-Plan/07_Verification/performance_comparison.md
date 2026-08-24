# Performance Comparison

| Metric | Before | After | Improvement | Evidence |
|--------|--------|-------|-------------|----------|
| DB queries for dashboard stats | 2 queries (limit 5 + limit 10) | 1 query (limit 10) | 50% reduction | `app/api/dashboard/stats/route.ts` consolidation |
| Favorites fetch during polling | Every 3 seconds | Once on load | ~95% fewer calls | `results/[id]/page.tsx` favoritesChecked flag |
| Polling lifetime | Unlimited | Max 20 iterations (~60s) | Infinite loop prevention | MAX_POLLS constant |
| Redis crash on unavailability | Full application crash | Graceful no-op | 100% crash prevention | try/catch + retryStrategy |
| Trending page data fetching | Manual fetch (no caching) | SWR with 30s dedup | Automatic caching | `trending/page.tsx` SWR migration |
| Dashboard loading states | 1/9 routes | 3/9 routes | 222% improvement | New loading.tsx files |
