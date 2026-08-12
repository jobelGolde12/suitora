# 02 — Data Models & Contracts

> Author role: Senior Architect / Tech Lead
> Grounded in `drizzle/schema.ts`, `lib/validation.ts`, `lib/utils/validation.ts`,
> `docs/data_schema.md`, and `docs/api/swagger.yaml` as audited 2026-08-11.

---

## 1. Entity / Domain Model Specification

All tables are SQLite (`drizzle-orm/sqlite-core`). Primary keys are `text`
nanoid-style IDs (`nanoid()` in `lib/utils/id.ts`). Timestamps are ISO-8601
strings stored as `text` with `CURRENT_TIMESTAMP` defaults. Soft deletes use a
`deleted_at` column (see §4.1).

### 1.1 `users` (auth identity)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| name | text | not null |
| email | text | not null, unique |
| emailVerified | integer(bool) | default false |
| image | text | nullable |
| selfImageUrl | text | nullable (uploaded photo used in analysis) |
| createdAt / updatedAt | text | default CURRENT_TIMESTAMP |

### 1.2 `sessions` (Better Auth)

id (PK), userId (FK→users, cascade), expiresAt (int, not null), token, ipAddress,
userAgent, createdAt, updatedAt.

### 1.3 `accounts` (Better Auth OAuth/password)

id (PK), userId (FK cascade), accountId, providerId, accessToken, refreshToken,
idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password,
createdAt, updatedAt. Passwords hashed by Better Auth; never plaintext.

### 1.4 `verifications` (Better Auth)

id (PK), identifier, value, expiresAt, createdAt, updatedAt. One-time reset
tokens enforced by expiry (`expiresAt`) — single-use semantics delegated to
Better Auth.

### 1.5 `analyses` (core domain entity)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| userId | text | FK→users cascade, indexed |
| productId | text | FK→products set null |
| userImage | text | not null |
| productImage | text | not null |
| generatedImage | text | nullable (try-on output) |
| tryOnStatus | text | not null, default "skipped"; lifecycle §4.2 |
| tryOnCategory / tryOnJobId / tryOnProvider / tryOnError / tryOnLatencyMs / tryOnStartedAt | mixed | nullable |
| overallScore | real | not null default 0 |
| bodyScore / styleScore / colorScore | real | nullable |
| bodyShape / skinTone / faceShape / styleType | text | nullable |
| recommendations | text (JSON array) | nullable |
| colorAnalysis | text (JSON) | nullable |
| status | text | not null default "completed"; pending/completed/failed |
| height / heightConfidence / weight / weightConfidence | real | nullable (AI estimates) |
| compatibilityMetadata | text (JSON) | nullable (rich fit metadata) |
| deletedAt | text | nullable, indexed |

Indexes: `analyses_user_id_idx`, `analyses_created_at_idx`, `analyses_deleted_at_idx`.

### 1.6 `favorites`

id (PK), userId (FK cascade), analysisId (FK cascade), productId (FK set null),
inWardrobe (bool default false), wardrobeTags (JSON default `[]`),
wardrobeFolder, addedToWardrobeAt, deletedAt, createdAt.
Unique: `favorites_user_analysis_idx (userId, analysisId)`.

### 1.7 `products` (normalized product data from URL extraction)

id (PK), sourceUrl (unique), title, brand, priceCents (int), currency, imageUrl,
metadata (JSON), createdAt, updatedAt.

### 1.8 `uploads` (asset ledger)

id (PK), userId (FK cascade, indexed), kind, url (not null), width, height,
mimeType, sizeBytes, createdAt.

### 1.9 `settings`

id (PK), userId (FK cascade, not null), preferences (JSON), updatedAt.

### 1.10 `audit_logs`

id (PK), userId, action (not null), details (JSON), createdAt.

### 1.11 `user_profiles` (per-user body/style profile)

id (PK), userId (unique, FK cascade).
Manual: phone, dateOfBirth, gender, height, weight, chest/waist/hip/shoulder/
inseam/arm/neck circumference, footLength/footWidth, shoeSize, bustCupSize.
AI-estimated: estimatedHeight(+Confidence), estimatedWeight(+Confidence),
bodyShape(+Confidence), skinTone, faceShape, bmiCategory.
Self image: selfImageUrl, selfImageThumbnailUrl, selfImageUploadedAt.
Style: styleTags (JSON), preferredBrands (JSON), preferredColors (JSON),
avoidColors (JSON), priceRangeMin/Max (int), fitPreference (default "regular"),
sizePreference (default "US").
Timestamps + deletedAt.

### 1.12 `meta`

key (PK), value.

### 1.13 `trend_items`

id (PK), provider (not null), providerId (not null), title (not null), brand,
description, category (not null), subcategory, gender, imageUrl (not null),
productUrl, price, currency, season, occasion, styleTags (JSON), colors (JSON),
popularityScore (default 0), isFeatured (bool), isAvailable (bool), lastSynced,
timestamps. Unique: `trend_items_provider_id_idx (provider, providerId)`.

### 1.14 `trend_sync_logs`

id (PK), provider, status (success|partial|failed), itemsFetched,
itemsUpserted, message, createdAt.

### 1.15 `stylist_messages` (AI stylist conversation)

id (PK), userId (FK cascade, indexed with createdAt), role (user|assistant),
content (not null), deletedAt, createdAt.

### 1.16 `wardrobe_folders`

id (PK), userId (FK cascade, indexed), name (not null), deletedAt, createdAt.

### 1.17 `favorite_outfits`

id (PK), userId (FK cascade, indexed), outfit (JSON, not null), deletedAt,
createdAt.

### 1.18 `backup_logs`

id (PK), status (success|failed), key (S3 key), sizeBytes, message, createdAt.

---

## 2. Database Schema Decisions

### 2.1 Normalization level

3NF-leaning with denormalization only where justified:
- Products are normalized out of analyses (URL extraction dedup).
- Wardrobe tags/folders reference favorites; folder name duplicated into
  `favorites.wardrobeFolder` as a soft label (folder delete moves items to
  "Unfiled") — accepted denormalization for simple, predictable queries.

### 2.2 Indexing strategy

Every FK used in a filter has an index: analyses(userId, createdAt, deletedAt),
favorites(userId, inWardrobe, deletedAt) + unique (userId, analysisId),
uploads(userId), trend_items(provider, providerId), stylist_messages(userId,
createdAt), wardrobe_folders(userId, deletedAt), favorite_outfits(userId,
deletedAt). Soft-delete scans rely on `deleted_at` indexes to keep history
queries on indexed paths.

### 2.3 Migration approach

- Schema source of truth: `drizzle/schema.ts`.
- Convention: **hand-written, dated SQL migrations** (e.g.
  `2026-08-04-add-wardrobe-fields.sql`) applied via `scripts/migrate.mjs`
  (`npm run db:migrate`) or `drizzle-kit push` locally.
- `npx drizzle-kit generate` available when a journaled migration is preferred.
- CI runs `db:migrate` + `db:status` against a fresh file DB
  (`continue-on-error: true` — schema parity informational).
- No destructive migrations in the history; rollback supported via
  `scripts/rollback.sh` at the deploy level and `npm run db:rollback` at the
  migration level.

---

## 3. API Contract Definitions

Conventions (from `lib/api/response.ts`):
- Success envelope: `{ success: true, ...data, message? }` (`apiOk`).
- Error envelope: `{ error: string, code: ErrorCode, requestId?, issues? }`
  (`apiError`/`handleError`).
- Error taxonomy (`lib/api/errors.ts`): VALIDATION(400), UNAUTHORIZED(401),
  FORBIDDEN(403), NOT_FOUND(404), CONFLICT(409), RATE_LIMIT(429),
  PAYLOAD_TOO_LARGE(413), UPSTREAM_UNAVAILABLE(503), BAD_REQUEST(400),
  INTERNAL(500).
- Every response carries `X-Request-Id` (proxy.ts + withApiRoute).

### 3.1 Auth — `/api/auth/*` (Better Auth, self-authing in proxy)

Endpoints: sign-in/email, sign-up/email, sign-out, get-session, forget-password,
reset-password, change-password, update-user. Contracts defined by Better Auth;
cookie `suitora.session_token` (secure in prod, httpOnly, sameSite=lax).

### 3.2 Upload — `POST /api/uploads`

Request: multipart file (image), `kind` (user|product).
Validation: MIME in {image/jpeg, image/png, image/webp}; size ≤ 5MB; non-zero
byte length. Server-side only; proxy does not gate.
Success: 200 `{ success, uploadId?, url, width, height, mimeType, sizeBytes }`.
Errors: 400 VALIDATION (type/size), 413 PAYLOAD_TOO_LARGE, 500 INTERNAL.

### 3.3 Analysis — `/api/analysis`

`POST`: body per `createAnalysisSchema`:
`{ productUrl?: string (http/https), productImageUpload?: string (URL),
   userImageUrl?: string, category?: string }`.
Rules: at least one product source; user image falls back to
`users.selfImageUrl`; productUrl SSRF-guarded. Returns `{ analysisId }`.
Rate limit: `analysisRateLimiter` (per-user daily cap) → 429 + Retry-After.
`GET ?id=` / `GET ?limit=&offset=`: ownership-scoped; returns
`{ analyses | analysis, progress, stage, message, isFavorite? }`.
`DELETE ?id=`: soft delete + best-effort Cloudinary cleanup of generated image.

### 3.4 Favorites — `/api/favorites`

`GET`: list user's favorites (with analysis joins, isFavorite true).
`POST { analysisId, productId?, inWardrobe?, wardrobeTags?, wardrobeFolder? }`.
`DELETE ?id=`: soft delete. 409 on duplicate (unique index).

### 3.5 Wardrobe — `/api/wardrobe*`

- `GET/POST /api/wardrobe`: items with `inWardrobe=true`, folders list.
- `POST /api/wardrobe/folders { name }`, `DELETE /api/wardrobe/folders/[id]`
  (moves items to "Unfiled"), `PATCH /api/wardrobe/folders/[id] { name }`.
- `GET/POST /api/wardrobe/outfits` (recommendations), `POST
  /api/wardrobe/outfits/favorite { outfit }`.
Validation: folder name non-empty ≤ 60 chars; tags JSON arrays; ownership-scoped
queries prevent IDOR.

### 3.6 Stylist — `/api/stylist`

`GET`: restore thread (latest N messages). `POST { message }` (≤ 2000 chars):
appends user + assistant message via `lib/ai/stylist.ts`; content
context-restricted (fashion only, off-topic refusal server-side). Rate limited.

### 3.7 Trending — `/api/trending*`

`GET /api/trending?category=&page=` public feed (cache-first, TTL).
`GET /api/trending/[id]` detail + similar (via `/api/trending/similar`).
`POST /api/trending/sync` cron-guarded (`CRON_SECRET`).

### 3.8 Dashboard — `/api/dashboard/stats`

`GET` (auth): totals, average score, favorites count, weekly activity; read via
`dbRead`.

### 3.9 User profile — `/api/user*`

`GET/PATCH /api/user/profile` (updateProfileSchema), `POST
/api/user/profile/estimate`, `GET/PATCH/DELETE /api/user/self-image` (uploads),
`GET /api/user/data` (GDPR export), `GET/DELETE /api/user`.

### 3.10 Try-on webhook — `POST /api/tryon/webhook`

Shared-secret auth (`RUNPOD_WEBHOOK_SECRET` in query/header/body, constant-time
compare). Updates `analyses.tryOnStatus`, `generatedImage`, latency, error.

### 3.11 Ops

`GET /api/health` (public liveness), `GET /metrics` (prom-client, excluded from
proxy gate), `POST /api/backup` + `POST /api/uploads/cleanup` (cron-guarded),
`GET /api/docs` + `GET /api/docs/spec` (OpenAPI).

---

## 4. Validation Rules (input boundaries)

Central schemas in `lib/validation.ts` (server) + `lib/utils/validation.ts`
(shared client/server):

- `createAnalysisSchema`: productUrl must be http/https URL (SSRF re-checked in
  route); category enum from `config/category-display.ts`; image URLs length-capped.
- `imageFileSchema` (client+server): MIME allow-list, size 1..5MB, non-zero bytes.
- `updateProfileSchema`: name ≤ 50, email format, numeric bounds on measurements
  (0 < value < 300 cm / 500 kg), arrays capped.
- `password`: ≥ 8 chars, matches confirmation (Zod refine).
- `stylistSchema`: message 1..2000 chars, trimmed.
- Query schemas: `analysisQuerySchema`, pagination `limit ≤ 50`.
- Webhook: shared-secret + payload shape validated via `lib/ai/tryon/validation.ts`.

Every Route Handler boundary uses `parseBody`/`validateQuery` (Zod); all pages
with forms use RHF + same shared schemas.

---

## 5. State Machines (text-based)

### 5.1 `analyses.status`

```
created(pending)
  → completed   (vision pipeline finished)
  → failed      (provider error / timeout) → retryable by re-running analysis
```
Transition `pending → completed` happens ≥6s after creation in the GET poller
(or immediately when a try-on job already completed).

### 5.2 `analyses.tryOnStatus`

```
skipped → pending → processing → succeeded
                        └───────→ failed (webhook error / timeout, tryOnError set)
pending → (timeout / max wait exceeded) → failed
```
Advanced by `syncTryOnLifecycle` (`lib/ai/tryon/lifecycle.ts`) on read and by
the webhook. Lazy submit: job created on first poll when provider configured.

### 5.3 `trend_sync_logs.status`

`success | partial | failed` — one row per sync run.

### 5.4 `favorites` wardrobe lifecycle

```
normal favorite → inWardrobe=true (+folder/tags) → folder rename propagates
  → folder delete → wardrobeFolder="Unfiled" → delete (soft) → deletedAt set
```

---

## 6. Data Retention, Archival & Purge Policies

- **Soft deletes everywhere** (`deletedAt`): analyses, favorites, stylist
  messages, wardrobe folders, favorite outfits, user_profiles. Queries filter
  via `notDeleted()` (`lib/db/filters.ts`).
- **Hard purge / GDPR**: `GET /api/user/data` exports; account deletion clears
  sessions + hard-deletes owned rows (better-auth delete user flow). Policy per
  `privacy_policy/PRIVACY_POLICY.md`.
- **Backups**: daily S3 dumps retained 30 daily + 12 monthly
  (`jobs/retention.ts`, `BACKUP_RETAIN_*`).
- **Cache TTLs**: trending cache TTL-backed; analysis/session TTL-backed.
- **Audit**: `audit_logs` appended on privileged actions; retention TBD — review
  quarterly (documented as an operational decision in the roadmap).

---

## Checklist

- [x] Complete entity/domain model specification (all entities, fields, types, constraints, relationships)
- [x] Database schema decisions (normalization level, indexing strategy, migration approach)
- [x] API contract definitions for every endpoint (method, path, request/response schemas, status codes, error formats)
- [x] Validation rules for every input boundary
- [x] State machine diagrams for any entities with lifecycle states (text-based)
- [x] Data retention, archival, and purge policies if applicable
