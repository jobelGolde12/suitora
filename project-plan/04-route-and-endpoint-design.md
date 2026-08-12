# 04 — Route & Endpoint Design

> Author role: Senior Architect / Tech Lead
> Complete route table, proxy (middleware) pipeline, and request lifecycle for
> the Suitora App Router application. Grounded in `app/` tree, `proxy.ts`, and
> `app/api/**` as audited 2026-08-11.

---

## 1. Complete Route Table

### 1.1 Page routes

| Route | Component | Auth | Notes |
|-------|-----------|------|-------|
| `/` | `app/(landing)/page.tsx` | Public | Static; Hero/TrustBar/Features/HowItWorks/FAQ/CTA |
| `/login` | `app/(auth)/login/page.tsx` | Public (redirect to /dashboard if authed) | RHF + Zod |
| `/register` | `app/(auth)/register/page.tsx` | Public (redirect if authed) | includes agreeToTerms |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Public | |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Public | one-time token |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Proxy-gated | stats, recent analyses, quick actions |
| `/upload` | `app/(dashboard)/upload/page.tsx` | Proxy-gated | dual dropzones, validation |
| `/analysis` | `app/(dashboard)/analysis/page.tsx` | Proxy-gated | progress polling |
| `/results/[id]` | `app/(dashboard)/results/[id]/page.tsx` | Proxy-gated | rich results; bottom nav hidden |
| `/history` | `app/(dashboard)/history/page.tsx` | Proxy-gated | search/sort/delete |
| `/favorites` | `app/(dashboard)/favorites/page.tsx` | Proxy-gated | wardrobe entry |
| `/compare` | `app/(dashboard)/compare/page.tsx` | Proxy-gated | 2–4 selection, side-by-side |
| `/trending` | `app/(dashboard)/trending/page.tsx` | Proxy-gated | feed, filters, carousel |
| `/trending/[id]` | `app/(dashboard)/trending/[id]/page.tsx` | Proxy-gated | detail + similar; bottom nav hidden |
| `/stylist` | `app/(dashboard)/stylist/page.tsx` | Proxy-gated | chat; aria-live thread |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Proxy-gated | profile/body/password/theme/subscription |
| `/wardrobe` | `app/(dashboard)/wardrobe/page.tsx` | Proxy-gated | items/folders/outfits |
| `/privacy-policy` | `app/(legal)/privacy-policy/page.tsx` | Public | static |
| `/terms-of-service` | `app/(legal)/terms-of-service/page.tsx` | Public | static |
| `/metrics` | `app/metrics/route.ts` | Internal only | excluded from proxy gate |

### 1.2 API routes

| Method + Path | Handler wrapper | Auth | Purpose |
|---------------|-----------------|------|---------|
| POST `/api/auth/*` | Better Auth | Public (self-authing) | sign-in/up/out, reset, sessions |
| POST `/api/uploads` | withApiRoute | Session (proxy gate) | upload to Cloudinary + validation |
| POST `/api/uploads/cleanup` | withApiRoute | Cron (`CRON_SECRET`) or session | purge stale uploads |
| POST `/api/analysis` | withApiRoute | Session + per-user rate limit | create analysis |
| GET `/api/analysis` | withApiRoute | Session | poll progress / history (paginated) |
| DELETE `/api/analysis` | withApiRoute | Session | soft delete + Cloudinary cleanup |
| GET `/api/dashboard/stats` | withApiRoute | Session | dashboard metrics (dbRead) |
| GET/POST/DELETE `/api/favorites` | withApiRoute | Session | favorite management |
| GET/POST `/api/wardrobe` | withApiRoute | Session | wardrobe items + folders |
| PATCH/DELETE `/api/wardrobe/folders/[id]` | withApiRoute | Session | rename/delete folder |
| GET/POST `/api/wardrobe/outfits` | withApiRoute | Session | outfit recommendations |
| POST `/api/wardrobe/outfits/favorite` | withApiRoute | Session | save outfit snapshot |
| GET/POST `/api/stylist` | withApiRoute | Session + rate limit | chat thread |
| GET `/api/trending` | withApiRoute | Public feed | trending items (cache-first) |
| GET `/api/trending/[id]` | withApiRoute | Public | item detail |
| GET `/api/trending/similar` | withApiRoute | Public | similar items |
| POST `/api/trending/sync` | withApiRoute | Cron (`CRON_SECRET`) | trigger provider sync |
| POST `/api/tryon/webhook` | withApiRoute | Shared secret (self-authing) | RunPod callback |
| GET/PATCH `/api/user/profile` | withApiRoute | Session | profile read/update |
| POST `/api/user/profile/estimate` | withApiRoute | Session | persist AI estimates |
| GET/PATCH/DELETE `/api/user/self-image` | withApiRoute | Session | self image management |
| GET `/api/user/data` | withApiRoute | Session | GDPR data export |
| GET/DELETE `/api/user` | withApiRoute | Session | user read/delete |
| GET `/api/backup` | withApiRoute | Cron or session | trigger backup job |
| GET `/api/health` | withApiRoute | Public | liveness probe |
| GET `/api/docs` + `/api/docs/spec` | plain | Public | Swagger UI + OpenAPI spec |
| GET `/metrics` | plain | Internal | prom-client scrape (excluded from gate) |

---

## 2. Middleware / Proxy Pipeline Specification (`proxy.ts`)

Order of operations for every matched request (matcher excludes static assets,
`_next/*`, `/metrics`, public file extensions):

1. **Correlation ID** — `getOrCreateRequestId()`: accept upstream
   `X-Request-Id` only if `/^[A-Za-z0-9-]{8,64}$/`, else generate UUID. Injected
   into request headers for downstream logging; echoed on the response.
2. **CORS preflight** (`OPTIONS`) — honored only for allow-listed origins
   (`CORS_ORIGINS`); untrusted → 403.
3. **Global rate limit** — for `/api/*`: per-IP sliding-window
   (`globalIpLimiter`, 100 req/min), 429 + `Retry-After` on exceed.
4. **API auth fast-path gate** — `/api/*` not under `selfAuthingApiPrefixes`
   (auth, tryon/webhook, trending, uploads/cleanup, backup, health) and missing a
   session cookie → 401. (Handlers still verify sessions server-side.)
5. **CORS response headers** — applied when origin is trusted.
6. **Page gate** — public pages (/, /login, /register, /forgot-password,
   /privacy-policy, /terms-of-service): authed users redirected to `/dashboard`
   (except `/`). Protected pages without a session cookie → 307 redirect to
   `/login`.
7. **Pass-through** — `NextResponse.next({ request: { headers } })` carrying the
   correlation ID + tags.

Conditional logic: proxy runs only on matched paths (matcher regex); `/metrics`
and static assets bypass entirely. Cookie presence is a **pre-filter only** —
every handler re-validates via `requireUser()`.

---

## 3. Request / Response Lifecycle Traced

### 3.1 Authenticated API call (e.g. `GET /api/analysis?id=...`)

```
Browser
 └→ proxy.ts: correlation id → global limit → cookie gate (session present) → next()
     └→ Route Handler GET
         ├→ requireUser() (React cache → Better Auth session check)
         ├→ withUserId(id) (attach to request ctx for logs)
         ├→ validateQuery(analysisQuerySchema) → 400 on bad input
         ├→ dbRead ownership-scoped select (userId AND id AND not deleted)
         │    ├→ none → apiError("Analysis not found", 404)
         ├→ syncTryOnLifecycle(analysis) (lazy submit / resolve)
         ├→ completed? → { analysis } | elapsed staging → { analysis, progress, stage, message }
         └→ withApiRoute wraps: metrics observed, X-Request-Id echoed
 └→ Browser renders results (or polls again)
```

### 3.2 Public page (`GET /`)

```
Browser → proxy.ts: correlation id (no /api, no gate) → next()
 → Server Component: static content, streaming suspense → HTML to browser
 → Next/Image optimized assets (Cloudinary) → CDN
```

### 3.3 Unauthenticated protected page (`GET /dashboard`)

```
Browser → proxy.ts: no session cookie + protected path → 307 redirect → /login
 (Location: /login; correlation id still tagged for tracing)
```

### 3.4 Try-on webhook (`POST /api/tryon/webhook`)

```
RunPod → proxy.ts: correlation id; global limit; /api/tryon/webhook is
 self-authing → skips cookie gate → next()
 → Handler: verify RUNPOD_WEBHOOK_SECRET (constant-time) → 401 if mismatch
 → validate payload (tryon validation schema) → 400
 → dbWrite update tryOnStatus/generatedImage/latency/error; monitoring counters
 → 200 { success }
```

---

## 4. Route Category → Middleware Stack Summary

| Category | Proxy steps | Handler steps | Status codes |
|----------|-------------|---------------|--------------|
| Public page | corr-id → next | RSC render | 200 |
| Auth page | corr-id → redirect authed | RSC render | 200 / 307 |
| Protected page | corr-id → gate → next | RSC render + requireUser | 200 / 307 |
| Public API | corr-id → global limit → self-auth skip → next | handler-specific | 200/400/429/500 |
| Protected API | corr-id → global limit → cookie gate → next | requireUser + zod + scoped query | 200/400/401/404/409/429/500 |
| Webhook | corr-id → global limit → self-auth skip | shared-secret + schema | 200/400/401/500 |
| Cron | corr-id → global limit → self-auth skip | CRON_SECRET compare | 200/401/500 |

---

## Checklist

- [x] Complete route table (every route, HTTP method, controller/handler, middleware stack, auth requirements)
- [x] Middleware pipeline specification (order, purpose, conditional logic)
- [x] Request/response lifecycle traced through the stack for each route category
