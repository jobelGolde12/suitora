# Data Schema & Storage Guide

This document defines the canonical data schema for Suitora and the conventions for storing and caching data across the stack (database, cache, and browser local storage). Use this as the single source of truth for the data shape that routes, handlers, and UI components must read and write.

Important: all UI and data persistence decisions should follow the design & interaction rules in `premium-editorial-ui.md` before making UX trade-offs.

---

## High-level storage responsibilities
- Database (Turso / SQLite via Drizzle): canonical, authoritative records (users, analyses, products, favorites, uploads, settings, audit logs).
- Short-term cache (in-memory or Redis-like): frequently-read derived data that can be recomputed (dashboard stats, recent analyses list, analysis processing status). Cache keys should be ephemeral and have explicit TTLs.
- Browser localStorage / sessionStorage: light client-only preferences and non-sensitive UX state (theme preference, last-viewed tab, onboarding shown). Never store authentication secrets or tokens that require server validation in localStorage.

---

## Database (schema examples)
The SQL below is written for SQLite / Postgres-compatible datastores (adapt types where necessary). Use Drizzle migrations to implement the schema.

Notes:
- Use `id` as `TEXT` UUID strings for cross-platform consistency.
- Store timestamps as ISO8601 `TEXT` or native `DATETIME` depending on DB.

### users
Stores account details and minimal profile metadata.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  // provider-specific ids if using Better Auth
  provider TEXT,
  provider_id TEXT,
  is_admin BOOLEAN DEFAULT 0
);

Indexes:
- UNIQUE(email)
- INDEX(provider, provider_id)

TypeScript interface (example)

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
  providerId?: string;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt?: string;
}

### analyses
Each analysis is a single result produced for a (user, product) pair or for an uploaded clothing item.

CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT,                 -- optional: if analysis references a product record
  upload_image_url TEXT,           -- clothing image used
  user_image_url TEXT,             -- user photo used
  overall_score INTEGER,           -- 0-100
  body_score INTEGER,
  color_score INTEGER,
  style_score INTEGER,
  compatibility_metadata JSON,     -- freeform detailed insights from AI (body shape, palette, notes)
  recommendations JSON,            -- suggested items or tags
  status TEXT DEFAULT 'completed', -- pending | analyzing | completed | failed
  created_at TEXT NOT NULL,
  updated_at TEXT
);

Indexes:
- INDEX(user_id)
- INDEX(product_id)
- INDEX(created_at)

TypeScript interface

interface Analysis {
  id: string;
  userId: string;
  productId?: string | null;
  uploadImageUrl?: string | null;
  userImageUrl?: string;
  overallScore: number;
  bodyScore?: number;
  colorScore?: number;
  styleScore?: number;
  compatibilityMetadata?: Record<string, any>;
  recommendations?: any[];
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

### products
Optional table when product URLs are pasted or extracted; stores product metadata.

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  source_url TEXT UNIQUE,
  title TEXT,
  brand TEXT,
  price_cents INTEGER,
  currency TEXT,
  image_url TEXT,
  metadata JSON,   -- scraped details (size, color variants)
  created_at TEXT,
  updated_at TEXT
);

Indexes:
- UNIQUE(source_url)
- INDEX(brand)

### favorites
Simple join for users favoriting analyses or products.

CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES analyses(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

Indexes:
- INDEX(user_id)
- INDEX(analysis_id)
- UNIQUE(user_id, analysis_id)  -- prevent duplicate favorites

### uploads
Track uploads for debugging, retention, and S3/Cloudinary lifecycle.

CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  kind TEXT,             -- 'user_photo' | 'product_image'
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);

### settings
Per-user preferences persisted server-side.

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences JSON,   -- e.g. { theme: 'light', density: 'comfortable' }
  updated_at TEXT
);

### audit_logs (optional)
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details JSON,
  created_at TEXT NOT NULL
);

---

## Cache key patterns and TTLs
Use short, explicit TTLs and clear invalidation rules. Cache is a performance layer only.

- `user:{userId}:dashboard_stats` — TTL: 60s - 300s. Recompute after an analysis completes or when a favorite is added.
- `user:{userId}:recent_analyses` — TTL: 60s - 120s. Invalidate on new analysis, deletion, or favorite change.
- `analysis:{analysisId}:status` — TTL: 30s. Used to poll analysis progress during processing.
- `product:{productId}:metadata` — TTL: 24h. Cache scraped metadata for product pages.
- `product:url:{encodedUrl}:id` — TTL: 24h. Maps external URLs to internal product IDs.

Invalidation rules:
- When an analysis completes, clear `user:{userId}:recent_analyses`, `user:{userId}:dashboard_stats`, and `analysis:{analysisId}:status`.
- When favorites change, clear `user:{userId}:dashboard_stats`.
- When product metadata scraper runs with updated info, update `product:{productId}:metadata` and `product:url:{encodedUrl}:id`.

---

## Local browser storage and client-side keys
Use `localStorage` only for non-sensitive UI preferences. Use httpOnly secure cookies for auth/session tokens.

Recommended keys and shapes:

- `suitora.ui:theme` (string) — "light" | "dark"; sync with server-side `settings.preferences.theme` where possible.
- `suitora.ui:density` (string) — "compact" | "comfortable".
- `suitora.session:seenOnboarding` (boolean) — whether onboarding has been shown.
- `suitora.lastViewed:results` (string) — id of last viewed analysis (non-sensitive).

Never store:
- Raw `OPENAI_API_KEY`, `TURSO_AUTH_TOKEN`, or Cloudinary secrets.
- Passwords or refresh tokens.

If you need to store short-lived tokens to support a client-only flow, use `sessionStorage` and document escape-hatches clearly.

---

## API payload examples
Below are canonical payload examples expected by route handlers.

Create Analysis (client -> server)

POST /api/analysis

{
  "userId": "user_123",
  "userImageUrl": "https://.../user.jpg",
  "uploadImageUrl": "https://.../shirt.jpg",
  "productUrl": "https://store.example/item/123",   // optional
  "meta": { "source": "paste_link" }
}

Server-side processing result (server -> DB)

INSERT INTO analyses (...) VALUES ...

Saved analysis (example returned to client)

{
  "id": "analysis_abc",
  "userId": "user_123",
  "overallScore": 82,
  "bodyScore": 80,
  "colorScore": 78,
  "styleScore": 88,
  "status": "completed",
  "compatibilityMetadata": {
    "bodyShape": "rectangle",
    "palette": "warm-neutral",
    "notes": "Try a slightly tapered hem"
  },
  "recommendations": [ { "productId": "p_1", "score": 86 } ],
  "createdAt": "2026-07-16T12:34:56.000Z"
}

Create Product (server)

POST /api/products
{
  "sourceUrl": "https://...",
  "title": "Linen Shirt",
  "brand": "BrandX",
  "imageUrl": "https://.../product.jpg",
  "priceCents": 3999,
  "metadata": { "sizes": ["S","M","L"] }
}

---

## Client-side caching strategy for UI
- Fetch `/api/dashboard` which aggregates stats server-side and uses cached keys for speed.
- The client should poll `analysis:{analysisId}:status` with exponential backoff while the analysis is `analyzing`.
- For optimistic UI, update `recent_analyses` client view locally after upload and mark entry as `pending` until server confirms.

---

## Retention, privacy and security notes
- Do not retain user images longer than necessary for the product experience. Define a retention window (e.g., 90 days) and delete stale uploads from storage and the `uploads` table.
- Mask or remove PII before storing logs or sharing analytics. Use `audit_logs` for operational visibility but keep `details` scrubbed.
- Store tokens and secrets only server-side (environment variables, secret manager). Never commit secrets to the repo.

---

## Migration & versioning
- Add `schema_version` to a small `meta` table, and increment for breaking schema changes.
- Prefer additive migrations (new columns, new tables); use backfilling scripts for data migrations.

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);

---

## Quick reference checklist for implementers
- [ ] Read `premium-editorial-ui.md` before changing UI storage behavior.
- [ ] Add new persistent fields to the DB schema and a corresponding Drizzle migration.
- [ ] Add cache key invalidation logic wherever writes occur.
- [ ] Keep localStorage usage limited to non-sensitive preferences.
- [ ] Document any new keys (DB, cache, localStorage) in this file.

---

File: [docs/data_schema.md](docs/data_schema.md)
