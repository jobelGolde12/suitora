# Security & Compliance Plan

> **Pillar 02 — Suitora Production Readiness**
> This document details the security and compliance work needed to bring the
> Suitora application to enterprise-grade production readiness. It expands the
> high-level gaps and action items into concrete, sectioned work packages with
> objective, current status, files to touch, steps, acceptance criteria, and
> priority for each.

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Threat Model](#2-threat-model)
3. [Current State Analysis](#3-current-state-analysis)
4. [Production Gaps](#4-production-gaps)
5. [Strategic Action Items](#5-strategic-action-items)
6. [Compliance & Policy](#6-compliance--policy)
7. [Ongoing Security Operations](#7-ongoing-security-operations)
8. [Success Metrics & Definition of Done](#8-success-metrics--definition-of-done)
9. [Sequencing & Dependencies](#9-sequencing--dependencies)

---

## 1. Scope & Objectives

### 1.1 Purpose
Bring Suitora's authentication, secret management, transport security, input
handling, and CI practices to a level that is safe for production traffic and
user data.

### 1.2 In Scope
- Authentication & session management
- Authorization of API routes
- Secret management & environment enforcement
- Abuse prevention (rate limiting, brute-force protection)
- Transport security (TLS/TLS termination, HSTS, security headers)
- Input validation & sanitization
- CORS policy
- Secret scanning in CI
- Documentation, incident response, and compliance artifacts

### 1.3 Out of Scope
- Database-level data integrity (see `03_database_data_integrity.md`)
- Observability/logging (see `04_observability_logging.md`)
- Dependency vulnerability patching policy (see `09_dependency_management.md`)

### 1.4 Reference Standards
- **OWASP Top 10 (2021)** — primary security checklist
- **OWASP ASVS** — detailed verification of controls
- **NIST SP 800-63B** — password & session guidelines
- **Let's Encrypt / Cloudflare** — TLS certificate provisioning

---

## 2. Threat Model

| # | Threat | Likelihood | Impact | Mitigating Control |
|---|--------|-----------|--------|--------------------|
| T1 | Unauthenticated access to private API/data | High | High | Session auth on all `/api` routes (middleware + per-route) |
| T2 | Credential stuffing / account takeover | High | High | Account lockout, rate limiting, session revocation on password reset |
| T3 | Secret leakage in repo/history/logs | Medium | Critical | `.env*` ignored, env validation, secret scanning in CI |
| T4 | DoS via uncontrolled request volume | High | Medium | Upstash rate limiting + load balancer limits |
| T5 | Cross-origin abuse / CSRF | Medium | Medium | CORS allow-list, `SameSite=Lax` cookies, `frame-ancestors 'none'` |
| T6 | Man-in-the-middle / cleartext traffic | Medium | High | TLS termination, HSTS preload, secure cookies |
| T7 | Malicious request payloads (injection, overflow) | Medium | High | Zod validation on all API bodies/params |
| T8 | Webhook forgery | Low | High | Constant-time shared-secret verification on `/api/tryon/webhook` |
| T9 | Data exfiltration via compromised provider | Low | Critical | Least-privilege API keys, scoped upload storage |

> **Note:** T8 is already mitigated in `app/api/tryon/webhook/route.ts` via
> `timingSafeEqual` secret comparison. See §5.4 for hardening.

---

## 3. Current State Analysis

Detailed, file-mapped assessment of what exists today.

### 3.1 Authentication & Session Management
- **Implemented via Better Auth** (`lib/auth/index.ts`), not raw OAuth2 JWT.
- Email/password enabled with 7-day sessions, 1-day sliding update.
- Google OAuth enabled only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are
  both present.
- Cookies are `httpOnly`, `secure` in production, `SameSite=lax`, prefixed
  `suitora.*`.
- `middleware.ts` enforces session cookie presence for protected routes and
  redirects unauthenticated users to `/login`.

### 3.2 Secret Management
- `.env*` is present in `.gitignore` (all env files ignored).
- `lib/env.ts` validates server env vars with Zod; `BETTER_AUTH_SECRET` is
  enforced as required and min-length 16.
- Webhook secret (`RUNPOD_WEBHOOK_SECRET`) is read from env at request time.

### 3.3 Rate Limiting & Abuse Prevention
- `lib/rate-limit.ts` implements Upstash Redis sliding-window limiters:
  - Login (`5/15m`), brute-force (`15/24h`), failed attempts (`10/30m`)
  - Register (`3/1h`), register-email (`3/1h`)
  - Password reset IP (`5/1h`) and email (`3/1h`)
  - Try-on (`10/24h`), analysis (`20/1d`), upload (`10/1h`), stylist (`30/1h`)
- Applied at least in `app/api/analysis/route.ts` (per-user).

### 3.4 Transport & Security Headers
- `next.config.ts` sets: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, **HSTS
  (`max-age=31536000; includeSubDomains; preload`)**, `Permissions-Policy`, and a
  restrictive `Content-Security-Policy`.
- `docker/nginx/nginx.conf` runs on **port 80 only** — no TLS termination.
- `k8s/ingress.yaml` exists (see `01_architecture_scalability.md`).

### 3.5 Input Validation
- `lib/utils/validation.ts` defines Zod schemas for auth forms, profile updates,
  and file uploads (image type + size).
- **Not consistently applied** to all API route bodies/query params.

### 3.6 CORS
- No explicit `Access-Control-Allow-Origin` policy is configured; the app is
  same-origin and relies on the proxy. This is a gap for any future cross-origin
  clients.

### 3.7 CI / Secret Scanning
- No `.github/workflows` present — **no CI pipeline or secret scanning**.
- No `SECURITY.md`, no documented incident-response policy.

---

## 4. Production Gaps

| ID | Gap | Severity | Evidence |
|----|-----|----------|----------|
| G1 | API routes lack a consistent, enforced auth guard | **High** | Auth is duplicated per-route; middleware only checks cookie presence |
| G2 | No centralized request-body validation on API routes | **High** | `lib/utils/validation.ts` used mainly for forms |
| G3 | No explicit CORS allow-list | Medium | `next.config.ts` headers lack `Access-Control-Allow-Origin` |
| G4 | Nginx serves plain HTTP on port 80 (no TLS) | **High** | `docker/nginx/nginx.conf` |
| G5 | No CI pipeline or secret scanning (git-secrets/trufflehog) | **High** | `.github/` absent |
| G6 | No `SECURITY.md` or incident-response documentation | Medium | Repo root lacks the file |
| G7 | Rate limiting is not applied uniformly across all routes | Medium | Only some routes import `lib/rate-limit.ts` |
| G8 | No account lockout / unusual-login alerting beyond counters | Medium | Brute-force limiter exists but no lockout UX |
| G9 | No dependency vulnerability scanning in CI | Medium | See `09_dependency_management.md` |
| G10 | No signed security-contact / disclosure channel | Low | Requires `SECURITY.md` |

---

## 5. Strategic Action Items

Each action item is expanded into a work package. Priorities: **P0** (must for
launch), **P1** (short-term), **P2** (over time).

---

### Action Item 1 — Harden Authentication & Enforce Route Protection

**Priority:** P0

**Objective:** Ensure every private API route and page requires a valid session,
and that the Better Auth configuration is production-safe.

**Current status:** Better Auth is implemented (`lib/auth/index.ts`); middleware
checks cookie presence; individual routes call `auth.api.getSession`.

**Files to modify**
- `middleware.ts` — central gating
- `lib/auth/index.ts` — hardening knobs
- `app/api/**/route.ts` — consistent guard helper

**Steps**
1. Add a shared helper `requireUser()`/`requireSession()` in `lib/auth/` that
   runs `auth.api.getSession` and returns a typed user or throws a 401 —
   replacing the per-route duplication seen in `app/api/analysis/route.ts`.
2. Enforce `requireEmailVerification: true` in `lib/auth/index.ts` for
   production (currently `false`).
3. Add per-API-route validation in `middleware.ts` so unauthenticated calls to
   private `/api/*` (excluding `/api/auth` and public webhooks) return `401`
   before reaching handlers.
4. Add a `getSession` cache layer to avoid a DB round-trip on every request.
5. Document cookie hardening already present (`httpOnly`, `secure`,
   `SameSite=lax`) and confirm secure flag is derived from `NODE_ENV`.

**Acceptance criteria**
- All private API routes return `401` without a valid session.
- No route relies solely on cookie presence; each validates the session server-side.
- Sessions are revoked on password reset (already enabled).

---

### Action Item 2 — Secrets Management & Environment Enforcement

**Priority:** P0

**Objective:** No secrets in source, and all required vars fail-fast in production.

**Current status:** `.env*` ignored; `lib/env.ts` validates vars with Zod;
`BETTER_AUTH_SECRET` required.

**Files to modify**
- `lib/env.ts` — strengthen required-var rules
- `.env.example` (create) — document all vars
- Provider configs (`lib/ai/providers/*`, `lib/storage/cloudinary.ts`)

**Steps**
1. Promote optional-but-required-in-prod vars to required when
   `NODE_ENV === "production"` (e.g. `TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
   `OPENAI_API_KEY`, `CLOUDINARY_*`, `RUNPOD_*`).
2. Create `.env.example` documenting every variable and its purpose.
3. Add a startup check (in `lib/env.ts` or middleware) that fails fast in
   production if critical vars are missing.
4. Rotate any previously committed secrets (search git history; see Action Item 7).
5. Enforce per-service least-privilege keys (e.g. scoped Cloudinary upload key,
   read-only DB token where possible).

**Acceptance criteria**
- App refuses to boot in production when a critical env var is missing.
- No secret is hard-coded in any source file.
- `.env.example` documents 100% of used env vars.

---

### Action Item 3 — Uniform Rate Limiting

**Priority:** P0

**Objective:** Apply existing limiters consistently to all abuse-prone routes.

**Current status:** `lib/rate-limit.ts` defines limiters; only some routes use
them.

**Files to modify**
- `lib/rate-limit.ts` — add a generic `withRateLimit` helper
- `app/api/**/route.ts` — wrap handlers

**Steps**
1. Add a wrapper `withRateLimit(handler, limiter, keyFn)` in `lib/rate-limit.ts`
   that derives the key from the authenticated user id (when present) or IP.
2. Apply to: `uploads`, `stylist`, `tryon` (non-webhook), `favorites`, `wardrobe`,
   `user/profile`, `trending/sync` (CRON-guarded).
3. Ensure the target of **100 req/min/IP** is represented; add a global IP limiter
   for public endpoints.
4. Return a standardized `429` with `Retry-After` header via `lib/api/response.ts`.
5. Add a `RateLimitResult` abstraction so callers can branch on `success`.

**Acceptance criteria**
- All private write endpoints are rate-limited.
- Over-threshold requests return `429` with a `Retry-After` header.
- Limiter metrics are logged (see `04_observability_logging.md`).

---

### Action Item 4 — CORS Policy & Cross-Origin Controls

**Priority:** P1

**Objective:** Restrict cross-origin requests to a trusted allow-list.

**Current status:** No explicit `Access-Control-Allow-Origin` header; same-origin
app behind proxy.

**Files to modify**
- `next.config.ts` — `headers()`
- `lib/env.ts` — add `CORS_ORIGIN`/`BETTER_AUTH_TRUSTED_ORIGINS`

**Steps**
1. Add an env-driven allow-list (e.g. `CORS_ORIGINS`) and emit
   `Access-Control-Allow-Origin` only for matching origins.
2. Keep `Access-Control-Allow-Credentials: true` only for trusted origins
   (session cookies are required).
3. Restrict `Access-Control-Allow-Methods` to needed verbs
   (`GET, POST, PUT, PATCH, DELETE, OPTIONS`) and explicit headers.
4. Confirm `BETTER_AUTH_TRUSTED_ORIGINS` in `lib/auth/index.ts` matches the
   production domain.
5. Verify `frame-ancestors 'none'` in the CSP blocks clickjacking.

**Acceptance criteria**
- Cross-origin requests from non-allow-listed origins are rejected.
- Preflight `OPTIONS` requests return correct headers.
- Credentialed requests only succeed for trusted origins.

---

### Action Item 5 — TLS/SSL, HSTS & Transport Security

**Priority:** P0

**Objective:** All traffic served over HTTPS with a valid certificate and HSTS.

**Current status:** Security headers are set in `next.config.ts`; HSTS is
configured. Nginx listens on port 80 only.

**Files to modify**
- `docker/nginx/nginx.conf` — add TLS server block
- `docker/docker-compose.yml` — expose 443, mount certs
- `k8s/ingress.yaml` — enforce TLS + redirect
- `vercel.json` — if hosted on Vercel, force HTTPS

**Steps**
1. Provision certificates via **Let's Encrypt** (certbot) or **Cloudflare**
   (origin or edge TLS).
2. Add a port-443 `server` block in `nginx.conf` with the cert chain + key and
   `ssl_protocols TLSv1.2 TLSv1.3`.
3. Redirect all port-80 traffic to HTTPS (301) and return 421 for non-domain
   Host headers.
4. Keep the HSTS header (`max-age=31536000; includeSubDomains; preload`) already
   in `next.config.ts`; submit the domain to the HSTS preload list once stable.
5. Ensure `secure` cookies are set (already derived from `NODE_ENV`).

**Acceptance criteria**
- `https://` returns a valid, trusted certificate.
- All HTTP requests redirect to HTTPS.
- HSTS header present on every response; no mixed-content warnings.
- TLS 1.2+ only; TLS 1.0/1.1 disabled.

---

### Action Item 6 — Input Validation & Sanitization

**Priority:** P0

**Objective:** Every API request body, query, and path parameter is validated
with Zod before use.

**Current status:** `lib/utils/validation.ts` has form schemas; route handlers
destructure `req.json()` without validation (e.g. `app/api/analysis/route.ts`).

**Files to modify**
- `lib/validation.ts` (create) — consolidated API request schemas
- `app/api/**/route.ts` — apply `safeParse`/`parse` at the top of handlers
- `lib/api/response.ts` — add a validation-error helper

**Steps**
1. Create `lib/validation.ts` with schemas for every API route: analysis create,
   upload, stylist, wardrobe, favorites, profile update, tryon, trending params.
2. Centralize the existing form schemas from `lib/utils/validation.ts` or
   re-export for reuse.
3. Add `parseBody(schema, req)` and `validateQuery(schema, url)` helpers in
   `lib/api/response.ts` that return a `400` with field-level errors.
4. Sanitize/whitelist URLs passed to `extractProductFromUrlCached` (SSRF guard:
   block internal/link-local IPs) and enforce image-type/size checks already in
   `imageFileSchema`.
5. Apply validation to query params (e.g. `limit`/`offset` in analysis GET).

**Acceptance criteria**
- 100% of write endpoints validate request bodies.
- Invalid payloads return `400` with structured errors, not `500`.
- No unvalidated user input reaches DB writes or external fetch calls.

---

### Action Item 7 — Secret Scanning in CI

**Priority:** P0

**Objective:** Prevent secrets from entering the repository and detect historical
leaks.

**Current status:** No CI pipeline exists (`.github/` absent).

**Files to modify**
- `.github/workflows/security.yml` (create)
- `package.json` — add pre-commit hook (optional, e.g. husky + lefthook)

**Steps**
1. Create a `security.yml` pipeline that runs on push/PR.
2. Add `git-secrets` or `trufflehog` as a job scanning the repo for patterns
   (AWS keys, GitHub tokens, Slack tokens, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`,
   `RUNPOD_*`).
3. Add a `gitleaks` (or `trufflehog`) stage that fails the build on any hit.
4. Optionally add a pre-commit hook to scan before commit.
5. Audit current git history for leaked secrets and rotate any found.

**Acceptance criteria**
- CI fails when a known secret pattern is committed.
- Historical scan reports zero critical findings after cleanup.
- Secret rotation procedure documented for any leaked key.

---

### Action Item 8 — Create SECURITY.md & Incident Response

**Priority:** P1

**Objective:** Document security policies, responsible-disclosure, and response.

**Current status:** No `SECURITY.md` in repo root.

**Files to modify**
- `SECURITY.md` (create at repo root)

**Steps**
1. Add a `SECURITY.md` with:
   - Supported version policy
   - How to report vulnerabilities (private disclosure channel, GPG key if used)
   - Security contact / response timelines
   - Bug bounty or responsible-disclosure statement
2. Document the incident-response runbook: severity triage, containment steps,
   key rotation, user notification, and post-mortem.
3. Reference this plan and the monitoring setup in `04_observability_logging.md`.

**Acceptance criteria**
- `SECURITY.md` exists and links from the repo root.
- A clear private channel exists for vulnerability reports.
- Incident-response steps are written and reviewed.

---

## 6. Compliance & Policy

### 6.1 Applicable Frameworks
- **OWASP Top 10 (2021)** — mapped to action items in §2.
- **GDPR / privacy** — see `privacy_policy/PRIVACY_POLICY.md`; ensure data
  minimization and secure deletion paths (already present in analysis DELETE).

### 6.2 Data Retention & Deletion
- Confirm user-data deletion endpoints exist (`/api/user/data`).
- Ensure generated try-on images are removed from Cloudinary on delete
  (already handled in `app/api/analysis/route.ts` DELETE).

### 6.3 Logging & Audit
- Security events (login success/failure, password reset, rate-limit triggers,
  admin actions) should be emitted to the observability stack
  (see `04_observability_logging.md`).
- Do not log secrets, cookies, or full tokens.

### 6.4 Dependency & Supply-Chain
- Enforce lockfile (`package-lock.json`), run `npm audit` in CI, and pin
  provider SDK versions (see `09_dependency_management.md`).

---

## 7. Ongoing Security Operations

| Activity | Cadence | Owner |
|----------|---------|-------|
| Dependency vulnerability scan (`npm audit` / Dependabot) | Continuous / weekly | DevOps |
| Secret scan on every push/PR | Continuous | DevOps |
| OWASP Top 10 automated scan (e.g. OWASP ZAP / StackHawk) | Per release | Security |
| TLS certificate renewal check | Monthly | DevOps |
| Rotate provider API keys | Quarterly or on leak | Team |
| Review rate-limit thresholds against traffic | Quarterly | Backend |
| Update `SECURITY.md` and incident runbook | Semi-annual | Security |

---

## 8. Success Metrics & Definition of Done

| Metric | Target | Status now |
|--------|--------|-----------|
| All API routes require a valid session | 100% private routes | Partial (per-route) |
| No secrets in repository history | 0 findings | Unknown (no scan) |
| Rate limit blocks > 100 req/min per IP | Enforced with `429` | Partial |
| All responses served over HTTPS with valid cert | 100% | Nginx on port 80 |
| OWASP Top 10 scan reports zero critical findings | 0 critical | Not scanned |
| HSTS preload applied | `includeSubDomains; preload` | Header set |
| All write endpoints validate input | 100% | Partial |
| `SECURITY.md` published | Present | Missing |

**Definition of Done:** All P0 action items closed, all success metrics met, and
an OWASP Top 10 scan (manual or automated) reports zero critical findings.

---

## 9. Sequencing & Dependencies

Suggested order (respects dependency on `01_architecture_scalability.md`):

| Phase | Items | Rationale |
|-------|-------|-----------|
| **Phase 0** | A1 (auth hardening), A2 (secrets), A5 (TLS) | Core trust boundaries before launch |
| **Phase 1** | A3 (rate limiting), A6 (validation), A7 (CI secret scan) | Abuse & injection prevention |
| **Phase 2** | A4 (CORS), A8 (SECURITY.md) | Cross-origin hardening & policy docs |
| **Continuous** | §7 operations, OWASP scan, dependency audits | Ongoing assurance |

> **Blocking dependency:** A5 (TLS) requires the domain and proxy/ingress from
> `01_architecture_scalability.md`. A7 requires the CI pipeline from
> `06_cicd_deployment.md`.
