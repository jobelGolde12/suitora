# Suitora — Online Trending Fashion Data: Current State & Implementation Roadmap

> **Purpose:** Document the current trend-items system, why it's not acceptable, and provide a concrete implementation plan to replace the static curated dataset with real online trending fashion data.
>
> **Audience:** Developers, AI agents, and contributors implementing or extending the trend data pipeline.
>
> **Related docs:**
> - `docs/body_fit_match/trending_items_online.md` — Original trending items specification
> - `docs/body_fit_match/trend_outfit_display.md` — Display layer for trend items
> - `docs/body_fit_match/body_fit_file_component_map.md` — File map
> - `config/trend-providers.ts` — Provider configuration
> - `lib/trend/*` — Trend service layer
> - `types/trend.ts` — Trend type definitions

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Why the Current Approach is Insufficient](#3-why-the-current-approach-is-insufficient)
4. [Available Real-World Fashion Data Sources](#4-available-real-world-fashion-data-sources)
5. [Recommended Approach: Hybrid Multi-Provider System](#5-recommended-approach-hybrid-multi-provider-system)
6. [Implementation Phases](#6-implementation-phases)
7. [File Changes & New Files](#7-file-changes--new-files)
8. [Environment Variables](#8-environment-variables)
9. [Data Flow When Complete](#9-data-flow-when-complete)
10. [Fallback Strategy](#10-fallback-strategy)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Timeline Estimate](#12-timeline-estimate)

---

## 1. Current State Analysis

### 1.1 The Problem

The current "trending items" feature does **not** pull real trending data from online sources. It uses a static, hand-authored array of ~20 fake products stored in:

```
lib/trend/providers/curated.ts
```

These items have:
- **Fake brands** — "Atelier Noir", "Maison Lane", "Stride & Co" (no actual retailers)
- **Demo images** — Unsplash stock photos, not actual product listings
- **Fake prices** — invented values (no real market data)
- **Fake popularity** — hardcoded `popularityScore` values
- **Dead product links** — `https://example.com/products/...` (no real product pages)

### 1.2 Current File-by-File Breakdown

| File | Role | Problem |
|------|------|---------|
| `lib/trend/providers/curated.ts` | Static array of 20 fake products | **This is the core issue** — hardcoded demo data |
| `lib/trend/fetch.ts` | Dispatches to providers by ID | `"curated"` case returns static data; `"affiliate"` case exists but is disabled and has no real adapter |
| `config/trend-providers.ts` | Provider registry | Only `"curated"` is enabled; `"affiliate"` is disabled with no adapter file |
| `lib/trend/normalize.ts` | Converts `RawProviderProduct` → DB row | Well-structured, works for any provider |
| `lib/trend/sync.ts` | Orchestrates fetch → normalize → upsert | Correct pipeline, but feeds from fake data |
| `lib/trend/ranking.ts` | Sorts items by popularity/season/recency | Works correctly, meant for live data |
| `lib/trend/cache.ts` | In-memory TTL cache (5 min) | Works correctly |
| `types/trend.ts` | `RawProviderProduct`, `TrendItem`, filters | Well-designed, production ready |
| `drizzle/schema.ts` | `trend_items` table | Correct schema, ready for real data |
| `jobs/trend-sync.ts` | CLI entrypoint for scheduled sync | Works, but syncs fake data |
| `app/api/trending/route.ts` | GET endpoint with ranking + caching | Well-structured API, ready for real data |
| `app/api/trending/[id]/route.ts` | Single item + similar items | Well-structured |
| `app/api/trending/sync/route.ts` | POST to trigger sync | Works correctly |
| `components/trending/*` | UI layer | Works correctly, no changes needed |


## 3. Why the Current Approach is Insufficient

| Concern | Current State | Requirement |
|---------|--------------|-------------|
| Data freshness | Static, never changes | Items should update daily/weekly |
| Product links | `example.com` — dead links | Real shopping links users can click |
| Pricing | Invented dollar amounts | Real market prices |
| Brand authenticity | Fake brand names | Real brands users recognize |
| Trending accuracy | Hardcoded scores | Real popularity signals |
| Image quality | Unsplash stock photos | Actual product images |
| Category diversity | 20 items across limited categories | Hundreds of items across all categories |
| Seasonal relevance | Hardcoded season tags | Data that reflects current trends |
| User trust | Users see fake data = no trust | Real data = real value |

---

## 4. Available Real-World Fashion Data Sources

### 4.1 Free / Low-Cost Options

| Source | Type | Cost | Data Quality | Limitations |
|--------|------|------|-------------|-------------|
| **Shopify Storefront API** | GraphQL | Free | ★★★★★ | Requires partner signup per store; rate limited |
| **ASOS API** (public) | REST | Free | ★★★★★ | Limited documentation; may require partnership |
| **Zalando ZEOS** | REST | Free | ★★★★★ | Requires partnership application |
| **Rakuten RapidAPI** | REST | Freemium | ★★★★☆ | Free tier: 100 calls/month |

### 4.2 Paid / Premium Options

| Source | Type | Cost | Data Quality | Limitations |
|--------|------|------|-------------|-------------|
| **ShopStyle Collective** | Affiliate API | Commission-based | ★★★★★ | Must be approved as publisher |
| **Skimlinks** | Affiliate API | Commission-based | ★★★★★ | Must be approved as publisher |
| **RewardStyle** (LTK) | Affiliate API | Invite-only | ★★★★★ | Influencer-focused |
| **SerpAPI** (Google Shopping) | Search API | $50/month | ★★★★☆ | Good for trend discovery; real product links |

### 4.3 Recommended Free Stack

For a **free** implementation that still delivers real trending fashion data:

1. **Shopify Storefront API** — Access thousands of real Shopify stores' products (free, no API key needed for public storefronts)
2. **SerpAPI** (free tier: 100 searches/month) — Google Shopping results for real trending products
3. **RSS feeds** — Fashion blogs, trend reports, Google Trends (completely free)

---

## 5. Recommended Approach: Hybrid Multi-Provider System

### Phase 1 (MVP) — Immediate Real Data

Replace the `"curated"` provider with a **Shopify Storefront API** adapter that fetches products from real, popular fashion Shopify stores. This requires no API key for public storefronts.

**Stores to target** (all have public Shopify stores):
- SSENSE (has a public API)
- Gymshark (Shopify)
- Kith (Shopify)
- Allbirds (Shopify)
- MVMT (Shopify)

### Phase 2 (Scalable) — Multi-Provider

Add:
1. **SerpAPI adapter** — Google Shopping results for trend discovery
2. **ASOS public API adapter** — Large catalog of fashion items
3. **Affiliate adapter** — Skimlinks/LinkShare for monetized product links

### Phase 3 (Production) — Scheduled Sync

1. **Vercel Cron Jobs** — Free, runs daily
2. **Admin UI** — Manual sync trigger, provider health dashboard
3. **Trend scoring** — Real popularity signals from actual sales/views data

---

## 6. Implementation Phases

### Phase 1: Shopify Provider (Replace Curated)

**Objective:** Get real fashion products into the app immediately.

**Tasks:**

1. **Create `lib/trend/providers/shopify.ts`**
   - Fetch products from public Shopify storefronts using the Storefront API
   - Transform response into `RawProviderProduct[]`
   - Map Shopify categories to Suitora's `ItemCategory` taxonomy
   - Handle pagination (first 50 products per store)

2. **Add Shopify provider to `config/trend-providers.ts`**
   - `id: "shopify"`, `enabled: true`
   - No API key needed for public storefronts

3. **Update `lib/trend/fetch.ts`**
   - Add `case "shopify"` in the switch statement
   - Remove or deprecate `case "curated"`

4. **Add `remotePatterns` to `next.config.ts`**
   - Add Shopify CDN domains: `cdn.shopify.com`

5. **Seed initial data**
   - Run sync on deploy to populate `trend_items` with real products

**Deliverables:**
- [ ] `lib/trend/providers/shopify.ts`
- [ ] Updated `config/trend-providers.ts`
- [ ] Updated `lib/trend/fetch.ts`
- [ ] Updated `next.config.ts`

---

### Phase 2: SerpAPI Provider (Trend Discovery)

**Objective:** Add Google Shopping trend discovery for fashion trending signals.

**Tasks:**

1. **Install SerpAPI dependency**
   ```bash
   npm install serpapi
   ```

2. **Create `lib/trend/providers/serpapi.ts`**
   - Query Google Shopping for fashion keywords
   - Parse organic results into `RawProviderProduct[]`
   - Map Google Shopping categories to Suitora taxonomy
   - Handle rate limits (100 searches/month on free tier)

3. **Create `lib/trend/keywords.ts`**
   - Rotating keyword list for different categories and seasons

4. **Add SerpAPI to provider config**
   - `id: "serpapi"`, `enabled: true`
   - Requires `SERPAPI_API_KEY` env var

5. **Update fetch.ts**
   - Add `case "serpapi"`

**Deliverables:**
- [ ] `lib/trend/providers/serpapi.ts`
- [ ] `lib/trend/keywords.ts`
- [ ] Updated config and fetch
- [ ] Environment variable: `SERPAPI_API_KEY`

---

### Phase 3: ASOS Public API Provider

**Objective:** Add a large, dedicated fashion retailer's catalog.

**Tasks:**
1. Research ASOS API access — check current status of ASOS public API
2. Create `lib/trend/providers/asos.ts` with pagination and rate limiting
3. Add ASOS to provider config

---

### Phase 4: Scheduled Synchronization

**Tasks:**

1. **Set up Vercel Cron Jobs**
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/trending/sync",
         "schedule": "0 6 * * *"
       }
     ]
   }
   ```

2. **Enhance `app/api/trending/sync/route.ts`**
   - Support cron secret header for automated invocations
   - Log sync results to `trend_sync_logs` table

---

### Phase 5: Affiliate Link Integration

**Tasks:**
1. Sign up for an affiliate network (Skimlinks, ShareASale, or Rakuten)
2. Create `lib/trend/providers/affiliate.ts` with affiliate-tagged URLs
3. Update the existing affiliate placeholder in `fetch.ts`

---

## 7. File Changes & New Files

### New Files to Create

```
lib/trend/
├── providers/
│   ├── shopify.ts       ← NEW (Phase 1)
│   ├── serpapi.ts        ← NEW (Phase 2)
│   ├── asos.ts           ← NEW (Phase 3)
│   └── affiliate.ts      ← NEW (Phase 5)
├── keywords.ts           ← NEW (Phase 2)
│
vercel.json               ← NEW (cron jobs)
```

### Files to Modify

| File | Change |
|------|--------|
| `lib/trend/fetch.ts` | Add new `case` handlers for each provider |
| `config/trend-providers.ts` | Register each new provider with `enabled: true` |
| `next.config.ts` | Add `remotePatterns` for provider image CDNs |
| `app/api/trending/sync/route.ts` | Support Cron secret header |

### Files to Remove or Deprecate

| File | Action |
|------|--------|
| `lib/trend/providers/curated.ts` | Keep as fallback with `enabled: false` |

---

## 8. Environment Variables

```env
# Phase 2: SerpAPI (Google Shopping)
SERPAPI_API_KEY=your_serpapi_key

# Phase 3: ASOS (if API key required)
ASOS_API_KEY=your_asos_key

# Phase 4: Cron secret (protect /api/trending/sync)
CRON_SECRET=your_cron_secret

# Phase 5: Affiliate
TREND_AFFILIATE_API_KEY=your_affiliate_key
TREND_AFFILIATE_API_URL=https://api.affiliate-network.com
```

---

## 9. Data Flow When Complete

```
Shopify Storefront API (real products from real stores)
    │
    ├──→ fetch shopify.ts → 50+ real products
    │
SerpAPI / Google Shopping (real trend data)
    │
    ├──→ fetch serpapi.ts → organic shopping results
    │
ASOS API (real catalog)
    │
    ├──→ fetch asos.ts → product catalog
    │
Affiliate Network (monetized links)
    │
    ├──→ fetch affiliate.ts → tagged product URLs
    │
    ▼
normalize.ts (all providers → common TrendItem shape)
    │
    ▼
Turso DB (trend_items — hundreds of real products)
    │
    ├──→ Ranking (popularity, season, recency)
    ├──→ Caching (5 min TTL)
    │
    ▼
GET /api/trending → Real trend data with real prices,
                     real product images, real shopping links
    │
    ▼
TrendingCard UI → Users see authentic, current fashion
```

---

## 10. Fallback Strategy

### If All Live Providers Fail

1. **Keep `curated.ts` as fallback** with `enabled: false` by default
2. In `fetch.ts`, if all enabled providers return errors, enable the curated fallback:

```ts
export async function fetchAllProviders(): Promise<ProviderFetchResult[]> {
  const providers = getEnabledProviders();
  const results = await Promise.allSettled(
    providers.map((p) => fetchFromProvider(p.id))
  );
  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.products.length > 0
  );
  // If all live providers failed, fall back to curated data
  if (successful.length === 0 && providers.length > 0) {
    console.warn("[trend] All live providers failed, falling back to curated");
    const curated = await fetchFromProvider("curated");
    return [curated];
  }
  return successful.map((r) => (r as PromiseFulfilledResult<ProviderFetchResult>).value);
}
```

### Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| One provider fails | Other providers continue; log error |
| All providers fail | Fall back to curated data; show subtle warning to admin |
| Image CDN blocked | Show placeholder with item title |
| Rate limited | Use cached data; sync on next cycle |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Shopify API changes | Low | High | Wrap in adapter; add tests |
| SerpAPI free tier limit (100/mo) | High | Medium | Cache aggressively; queue calls strategically |
| ASOS API goes private | Medium | Medium | Multiple provider fallback strategy |
| Legal concerns scraping | Low | High | Only use official APIs; never scrape |
| Affiliate approval rejected | Medium | Medium | Proxy via existing affiliate management platforms |
| Image hotlinking blocked | Medium | Low | Upload images to own CDN; or use as-is with attribution |
| Rate limiting at high traffic | Medium | Low | Cache layer + staggered sync |

---

## 12. Timeline Estimate

| Phase | Effort | Dependencies | Can Ship Independently? |
|-------|--------|-------------|------------------------|
| **Phase 1: Shopify Provider** | 2–4 hours | None | ✅ Yes |
| **Phase 2: SerpAPI Provider** | 3–6 hours | `SERPAPI_API_KEY` env var | ✅ Yes |
| **Phase 3: ASOS Provider** | 2–4 hours | ASOS API access | ✅ Yes |
| **Phase 4: Scheduled Sync** | 1–2 hours | Vercel deployment | ✅ Yes |
| **Phase 5: Affiliate Links** | 4–8 hours | Affiliate network approval | ✅ Yes |

**Total estimated time:** 12–24 hours for full implementation

---

## Immediate Next Step

The recommendation is to **start with Phase 1 (Shopify Provider)** as it:
1. Requires **no API key** for public storefronts
2. Delivers **immediate real product data**
3. Uses the **existing architecture** without modifications
4. Gives users **real shopping links** they can click
5. Builds confidence in the feature immediately

The Shopify Storefront API is free, well-documented, and provides authenticated product data including:
- Real product titles and descriptions
- Real prices in local currencies
- Real product images from Shopify CDN
- Real product page URLs
- Inventory/availability status
- Categories and collections

missing 
SERPAPI_API_KEY
TREND_AFFILIATE_API_KEY
CRON_SECRET