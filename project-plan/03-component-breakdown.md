# 03 — Component Breakdown

> Author role: Senior Architect / Tech Lead
> Decomposes the Suitora web tier + worker into single-responsibility
> components, their interfaces, dependency graph, responsibility assignment,
> and error-handling strategy per layer. Grounded in the audited tree
> (`app/`, `components/`, `lib/`, `services/`, `jobs/`, `actions/`).

---

## 1. Decomposed Component Tree

### 1.1 Web tier (Next.js App Router)

```
app/
├── (landing)/                 → public marketing pages (Hero, Features, FAQ, CTA)
├── (auth)/                    → login / register / forgot-password / reset-password
├── (dashboard)/               → dashboard, upload, analysis, results/[id], history,
│                                favorites, compare, trending(+/[id]), stylist,
│                                settings, wardrobe  (proxy-gated, DashboardShell)
├── (legal)/                   → privacy-policy, terms-of-service (static content)
├── api/*                      → Route Handlers (see 04-route-and-endpoint-design)
├── layout.tsx                 → root layout: fonts, providers, theme anti-FOUC
├── proxy.ts                   → correlation ID, CORS, global rate limit, auth gate
├── globals.css                → Tailwind v4 tokens (light/dark)
├── error.tsx / not-found.tsx / loading.tsx
└── metrics/route.ts           → prom-client scrape (excluded from proxy gate)

components/
├── ui/        Button, Input, Card, Badge, CategoryBadge, Avatar, ScoreCircle,
│              Skeleton, Toast, ConfirmModal        (atomic primitives)
├── layout/    Navbar, Footer, Sidebar, MobileNav, MobileTopBar, DashboardShell,
│              PageTransition
├── landing/   Hero, TrustBar, Features, HowItWorks, ScrollSection, FAQ, CTA
├── dashboard/ PageHeader, EmptyState, MetricCard, ScoreBar, QuickActionCard, skeletons
├── upload/    Dropzone, preview, status live region
├── analysis/  progress animation, stage indicators
├── results/   ScoreOverview, FitSummary, MeasurementComparison, InsightsList,
│              ColorPaletteCard, SizeRecommendationCard, DetailedFitAnalytics,
│              CategoryHeroImage
├── history/   card grid, search, sort, favorites/delete actions
├── compare/   ComparisonView, selector
├── wardrobe/  ItemFolderModal, FolderManagerModal, OutfitSuggestions
├── stylist/   StylistChat (composer, chips, bubbles, aria-live thread)
├── trending/  TrendingGrid, TrendingCard, TrendingCarousel, TrendingFilters,
│              TrendingCollection, SimilarItems, TrendingCardSkeleton
├── settings/  PasswordChangeForm + settings panels
├── outfits/   outfit recommendation primitives
└── providers/ client providers (session, theme, toast)

hooks/         useMediaQuery, useFocusTrap
actions/       server actions (auth: login/register/logout/changePassword/reset)
```

### 1.2 Library layer (`lib/`) — the reusable domain core

```
lib/
├── auth/        index.ts (betterAuth config) · session.ts (getSession/requireUser)
│                actions.ts (server action wrappers) · client.ts (fetch helpers)
├── api/         response.ts (apiOk/apiError/handleError) · errors.ts (taxonomy)
│                request.ts (parseBody/validateQuery) · route.ts (withApiRoute)
├── ai/          vision.ts (analyzeWithVision) · fit-pipeline · fit-scoring ·
│                body-estimation · size-prediction · color-palette ·
│                item-attributes · product-extraction · similar-items ·
│                outfit-recommender · mock-analysis · upload.ts ·
│                stylist.ts (context-restricted replies) · stylist-chips ·
│                tryon/ (lifecycle, validation, category, monitoring, providers)
├── db/          queries.ts · filters.ts (notDeleted) · dump.ts/restore
├── trend/       providers (curated/shopify/asos/serpapi/affiliate) · normalize ·
│                rank · keywords · cache · sync · fetch
├── storage/     cloudinary.ts · s3.ts
├── security/    ssrf.ts (assertSafeHttpUrl)
├── api/         (see above)
├── utils/       cn · format · id (nanoid) · validation (shared schemas) · fit-deltas
├── env.ts       validateEnv (server schema, fail-fast)
├── logger.ts    pino structured logging
├── metrics.ts   prom-client registry
├── rate-limit.ts  Upstash sliding-window + in-memory fallback
├── cache.ts     caching helpers
├── tracing.ts   OpenTelemetry
├── email.ts     password-reset email
├── request-context.ts  per-request correlation context
├── retention.ts / season.ts / currency.ts / navigation.ts / swagger.ts / legal/
```

### 1.3 Background worker

```
services/worker/  try-on orchestration, trend sync, backup, retention, health
jobs/             backup.ts · restore.ts · retention.ts · health-check.ts ·
                  trend-sync.ts  (+ __tests__)
scripts/          migrate.mjs (+ -tryon/-wardrobe-folders) · rollback.sh ·
                  fix-schema-migrations.mjs
worker/           worker entrypoint (tsx services/worker/index.ts)
```

---

## 2. Interface / Contract Definitions (inter-component boundaries)

| Boundary | Contract |
|----------|----------|
| Route Handler → `withApiRoute` | `(req, { params }) → Promise<Response>`; wrapper adds ctx/metrics/errors |
| Route Handler → `requireUser` | `() → Promise<Session["user"] \| null>` |
| Route Handler → `parseBody(schema, req)` | `→ { data } \| { error: NextResponse }` |
| Route Handler → `dbWrite/dbRead` | typed Drizzle queries; never raw SQL |
| `analyzeWithVision({userImageUrl, clothingImageUrl})` | `→ { scores, traits, recommendations, colorAnalysis, height, weight, compatibilityMetadata? }` (from `lib/ai/vision.ts`) |
| Try-on provider | `submit(urls) → { jobId }`; `getStatus(jobId) → { status, imageUrl?, error? }` (mock/runpod) |
| Trend provider | `fetchTrending() → NormalizedTrendItem[]` |
| Storage | `uploadBuffer()` / `deleteImage(url)` (cloudinary/s3) |
| Session helpers | `getSession()`, `requireUser()`, `withUserId(id)` |
| Limiter | `limit(id) → { success, reset, remaining }` |
| `notDeleted(table)` | Drizzle condition `isNull(deletedAt)` |
| Stylist | `reply(messages) → assistant content` (fashion-topic restricted) |

---

## 3. Dependency Graph (no circular dependencies)

```
proxy.ts ─→ lib/rate-limit
app/api/* ─→ lib/auth/session ─→ lib/auth/index ─→ drizzle(adapter) ─→ lib/db
app/api/* ─→ lib/api/{route,response,errors,request}
app/api/* ─→ lib/ai/* ─→ lib/ai/providers ─→ external SDK/fetch
app/api/* ─→ lib/storage/cloudinary ─→ external CDN
app/api/* ─→ lib/db/queries ─→ drizzle/schema
lib/db.ts ─→ lib/env.ts (validateEnv, fail-fast)
lib/request-context ─→ lib/logger
lib/metrics ─→ prom-client
lib/ai/tryon/lifecycle ─→ lib/ai/tryon/providers ─→ lib/ai/tryon/monitoring
lib/trend/sync ─→ lib/trend/providers · lib/trend/{normalize,rank,cache}
```

Direction is strictly top-down: `app → lib → drizzle/external`. `lib/*`
modules never import `app/` or `components/`. The one deliberate join is
`lib/ai/vision.ts` ↔ `lib/ai/fit-pipeline` ↔ `lib/ai/fit-scoring` — all in the
same `lib/ai` package (no cycle). `app/api/analysis` imports
`lib/db/queries` helpers (documented; avoids a cycle through `app`).

---

## 4. Responsibility Assignment Matrix (components ↔ functional requirements)

| Component | Responsibilities | NFRs served |
|-----------|------------------|-------------|
| proxy.ts | correlation ID, CORS, global rate limit, auth fast-path gate | Security, Observability |
| withApiRoute | metrics, request ctx, centralized error funnel | Observability, Reliability |
| lib/auth/session | per-request cached session, ownership scoping | Security |
| lib/api/response | envelope + error taxonomy + safe error payloads | Security, Consistency |
| lib/ai/vision + fit-* | provider-agnostic analysis pipeline, scoring, persistence | Core business |
| lib/ai/tryon/* | try-on lifecycle, webhook validation, provider abstraction | Core business, Reliability |
| lib/trend/* | feed sync/normalize/rank/cache | Core business, Performance |
| lib/db/* | typed queries, soft-delete filters, dump/restore | Data integrity |
| lib/security/ssrf | outbound URL safety | Security |
| components/ui/* | accessible, reusable primitives | A11y, Consistency |
| components/layout/* | shell, nav, safe-area, session-aware navbar | UX, A11y |
| feature components | page-specific behavior + empty/loading/error states | UX, Reliability |
| jobs/* | backup, restore, retention, trend sync, health | Availability, DR |
| scripts/* | migrations, rollback | Data integrity, DR |

---

## 5. Error Handling Strategy per Component Layer

| Layer | Errors thrown | Handling |
|-------|---------------|----------|
| UI (client components) | fetch/network, validation, provider | toasts + inline errors (`aria-describedby`), rollback of optimistic updates, retry buttons, empty states; never silent |
| Server Components / pages | data access | `error.tsx` boundary (retry) + skeleton loading |
| Route Handlers | AppError, ZodError, upstream | `handleError` funnel: logs full detail, returns safe `{error, code, requestId}`; 401/403/404/409/413/429/500/503 |
| lib/api | Zod parse failures | `parseBody` → 400 VALIDATION, never throws on bad input |
| lib/ai providers | provider outage/timeout | abstracted; mock fallback; analysis marked `failed` with `tryOnError`; client retry path |
| lib/db | connect timeout, network | retry w/ exponential backoff (≤3) + overall timeouts; local file busy timeout |
| External webhook | bad secret, bad payload | constant-time secret compare → 401; invalid shape → 400; job marked failed |
| Worker/jobs | S3/DB/provider failures | structured pino logs; `backup_logs`/`trend_sync_logs` status rows; runbooks |
| Cross-cutting | unexpected | log `errorCode: INTERNAL`, stack + cause server-side; never leak internals to client |

Structured logging at every boundary: `lib/logger.ts` (pino) keyed by
`requestId`/`trace_id` via `request-context.ts`; Prometheus HTTP metrics
observe every wrapped route (status, duration, errors).

---

## Checklist

- [x] Decomposed component tree (modules, services, classes, functions) with single-responsibility boundaries clearly defined
- [x] Interface/contract definition for every inter-component boundary
- [x] Dependency graph showing which components depend on which (no circular dependencies)
- [x] Responsibility assignment matrix mapping components to functional requirements
- [x] Error handling strategy per component layer (what errors are thrown, caught, transformed, logged)
