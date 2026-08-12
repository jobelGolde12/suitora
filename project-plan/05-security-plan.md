# 05 — Security Plan

> Author role: Security Engineer
> Authentication, authorization, input handling, mitigation specifics, secrets,
> scanning cadence, headers/TLS, and encryption for the Suitora stack.
> Grounded in `lib/auth/*`, `proxy.ts`, `lib/security/ssrf.ts`,
> `lib/validation.ts`, `next.config.ts` headers, and `SECURITY.md`.

---

## 1. Authentication Mechanism

**Mechanism:** Better Auth cookie sessions (email/password, optional Google
OAuth), DB-backed.

- Session store: `sessions` table via drizzleAdapter; 7-day expiry
  (`session.expiresIn`), 1-day update age, sliding renewal.
- Cookie: prefix `suitora` → `suitora.session_token`
  (or `__Secure-` variant in prod). `httpOnly`, `sameSite=lax`,
  `secure` in production.
- Email verification: `requireEmailVerification` **on** in production.
- Password reset: one-time token via `verifications` (expiry enforced), URL
  points at `/reset-password`; reset revokes all sessions
  (`revokeSessionsOnPasswordReset: true`).
- Password change: better-auth `changePassword` (inline validation in
  `PasswordChangeForm`); no plaintext — hashed by Better Auth.
- `trustedOrigins` default `http://localhost:3000`, override via
  `BETTER_AUTH_TRUSTED_ORIGINS`.
- **No client-side-only auth decisions.** Every protected route/handler calls
  `requireUser()` (server-side session verification); the proxy cookie check is
  a fast pre-filter only.

---

## 2. Authorization Model

- **Model:** Ownership-scoped (IDOR-preventing) per-resource checks. No
  RBAC/roles currently — single actor (the user) with admin surface only via
  ops endpoints.
- Every query on a user-owned resource filters by `userId` (analyses,
  favorites, wardrobe, stylist, profiles, self-image) — verified in
  `app/api/analysis` (`and(eq(id), eq(userId), notDeleted())`) and mirrored
  across routes.
- **Ops endpoints** (backup, uploads/cleanup, trending/sync): guarded by
  `CRON_SECRET` shared-secret comparison or session; webhook guarded by
  `RUNPOD_WEBHOOK_SECRET` (constant-time compare).
- **Route gating matrix:** see `04-route-and-endpoint-design.md` §4.
- Permission matrix:

| Resource | Read | Write | Delete |
|----------|------|-------|--------|
| analyses | owner | owner (POST creates) | owner (soft delete) |
| favorites/wardrobe | owner | owner | owner (soft delete) |
| stylist thread | owner | owner | — |
| profile/self-image | owner | owner | owner |
| trend feed | public | cron | — |
| backups | cron/session | cron | cron/retention job |

---

## 3. Input Sanitization & Output Encoding

- **All server boundaries validate with Zod** (`parseBody`/`validateQuery`;
  `lib/validation.ts` + `lib/utils/validation.ts`).
- File uploads: MIME allow-list (jpeg/png/webp), size 1–5MB, **zero-byte
  rejection** server + client (EDGE-060).
- Product URLs: validated `http(s)` then **SSRF-guarded** via
  `lib/security/ssrf.ts` (`assertSafeHttpUrl` — blocks private ranges,
  link-local, DNS rebinding probes) before `extractProductFromUrlCached`.
- Output encoding: React escapes text by default; JSON persisted via
  `JSON.stringify` and never rendered as `dangerouslySetInnerHTML`; profile
  name length-capped (≤50).
- Webhook payloads validated by `lib/ai/tryon/validation.ts`.

---

## 4. OWASP Top-10 Mitigations (stack-specific)

| Threat | Mitigation |
|--------|-----------|
| A01 Broken Access Control | Ownership-scoped queries; proxy gate + server-side `requireUser`; ops secrets |
| A02 Cryptographic Failures | Argon/bcrypt via Better Auth; HSTS preload; TLS enforced in prod |
| A03 Injection (SQL/XSS) | Drizzle parameterized queries (no raw SQL); React escaping; CSP |
| A04 Insecure Design | Rate limits on analysis/stylist/global; validation-first handlers |
| A05 Misconfig | Central `validateEnv()` fail-fast; security headers (see §7); secrets never in client bundle |
| A06 Vulnerable deps | `npm audit` in CI (security.yml); gitleaks secret scan |
| A07 Auth failures | Email verification in prod; session revocation on reset; httpOnly cookies |
| A08 Integrity | Signed webhook secret (constant-time); OTel trace correlation |
| A09 Logging/monitoring | pino structured logs; requestId correlation; Grafana alerts |
| A10 SSRF (server-side) | `lib/security/ssrf.ts` on all outbound user-influenced fetches |

---

## 5. Secrets Management

- No secrets in source. `.env*` gitignored; template in `.env.example`.
- Validated centrally (`lib/env.ts`): `BETTER_AUTH_SECRET` required at runtime
  everywhere; production runtime additionally requires Turso, Upstash, OpenAI,
  Cloudinary, RunPod, S3 config → fail-fast boot.
- Only `NEXT_PUBLIC_*` vars reach the client bundle (Cloudinary cloud name).
- Deployment secrets injected from platform secret managers (Vercel /
  GitHub Actions `secrets.*` / k8s secrets) — never committed.
- Repository scanning: gitleaks in `security.yml` (full history).

---

## 6. Dependency Vulnerability Scanning

| Tool | Cadence | Where |
|------|---------|-------|
| `npm audit --omit=dev` | Every push/PR | `.github/workflows/security.yml` |
| Gitleaks secret scan | Every push/PR (full history) | `.github/workflows/security.yml` |
| Lockfile review | On dependency change | PR review |
| Update policy | Minor/patch via `npm update`; majors reviewed | `production-plan/09_dependency_management.md` |

---

## 7. Security Headers & TLS

Applied via `next.config.ts` `headers()` for all routes:

- `Content-Security-Policy`: `default-src 'self'`; script-src self +
  unsafe-eval/inline (Next dev/edge requirement — tighten in prod build);
  img-src self + allow-listed CDNs (unsplash, cloudinary, shopify, asos,
  skimlinks) + data/blob; connect-src self + openai + upstash; frame-ancestors
  'none'; base-uri 'self'; form-action 'self'.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- TLS: enforced in production; secure cookies.

---

## 8. Data Encryption

- **At rest:** Turso/libSQL managed storage; backups gzip-compressed to
  S3-compatible storage (SSE available via provider policy).
- **In transit:** TLS 1.2+ end-to-end; HSTS.
- **Field-level:** passwords hashed by Better Auth; reset tokens one-time +
  expiring; session tokens stored hashed by Better Auth adapter.
- **Client storage:** theme preference only (`suitora-theme`) — no PII in
  localStorage.

---

## Checklist

- [x] Authentication mechanism specification (token types, session management, refresh logic)
- [x] Authorization model (RBAC/ABAC/ReBAC, role definitions, permission matrix)
- [x] Input sanitization and output encoding strategy
- [x] CSRF/XSS/SQL Injection/command injection mitigation specifics for the tech stack
- [x] Secrets management approach
- [x] Dependency vulnerability scanning cadence and tooling
- [x] Security headers and TLS configuration specification
- [x] Data encryption specification (at-rest, in-transit, field-level where needed)
