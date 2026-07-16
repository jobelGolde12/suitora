# Analysis ↔ DB Schema Alignment Report

This repo currently **does not** persist analyses/favorites to the `analyses` and `favorites` tables as described in `docs/data_schema.md`.

Below is the concrete mismatch that prevents “features like favorite should pass to the database”.

---

## 1) What `docs/data_schema.md` expects (canonical)

### `analyses` table shape (canonical)
- `user_id`
- `product_id` (optional)
- `upload_image_url`, `user_image_url`
- `overall_score`, `body_score`, `color_score`, `style_score`
- `compatibility_metadata` (JSON)
- `recommendations` (JSON)
- `status` (pending/analyzing/completed/failed)
- `created_at`, `updated_at`

### `favorites` table shape (canonical)
- `user_id`
- `analysis_id` (and optional `product_id`)
- `created_at`
- UNIQUE constraint `(user_id, analysis_id)` to prevent duplicates

---

## 2) What the app actually implements

### Drizzle schema (`drizzle/schema.ts`) differs from canonical
Current `analyses` columns (repo):
- `userId`
- `userImage` (NOT `user_image_url`)
- `productImage` (NOT `upload_image_url`)
- `generatedImage`
- `overallScore`, `bodyScore`, `styleScore`, `colorScore` as `real`
- `bodyShape`, `skinTone`, `faceShape`, `styleType`
- `recommendations` as **text**
- `colorAnalysis` as **text**
- `createdAt`

There is **no**:
- `compatibility_metadata` JSON field
- `status` field
- `updated_at`
- `upload_image_url` / `user_image_url` naming
- `product_id`

### UI pages are mock-only
- `app/(dashboard)/analysis/page.tsx` runs `analyzeFashion` from `lib/ai/mock-analysis.ts` and then routes to `/results/mock_result_...`.
- `app/(dashboard)/favorites/page.tsx`, `app/(dashboard)/history/page.tsx`, and `app/(dashboard)/results/[id]/page.tsx` all render **mock objects in component state**, not DB-backed queries.
- Favorite toggling is purely `setState(...)` + toast; there are **no calls** to `lib/db/queries.ts` `addFavorite/removeFavorite/isFavorite`.

---

## 3) Required change to satisfy the task
To make analyses pass to DB “like favorite should pass to the database”, the app needs:

1. **Server routes (or server actions)** that:
   - Create an `analyses` row with values matching the canonical columns.
   - Persist `recommendations` and compatibility JSON.
   - Update `status` as analysis progresses.
2. UI pages must read persisted data:
   - Favorites list must query `favorites` join with `analyses`.
   - Favorite toggle must call `addFavorite/removeFavorite` on the server.
   - Results page must fetch analysis by id.

---

## 4) Why current repo cannot pass the task as-is
- There are **no API endpoints** under `app/api/*` besides auth.
- Results/History/Favorites/Analysis pages rely on `mock*` constants.
- Even where DB query helpers exist (`lib/db/queries.ts`), the UI never calls them.

---

## 5) Minimal concrete alignment options (choose one)

### Option A (recommended): Make DB schema match `docs/data_schema.md`
- Update `drizzle/schema.ts` + migrations to add canonical columns and types:
  - Add `status`, `updated_at`
  - Replace/rename `userImage`/`productImage` with `user_image_url` and `upload_image_url`
  - Add JSON columns `compatibility_metadata`, `recommendations` (store arrays/objects as JSON strings in SQLite)
- Then implement server endpoints and wire UI to them.

### Option B: Keep current DB schema, update `docs/data_schema.md`
- This conflicts with the task request (“make sure data in analysis would pass to the database in analyses table”), but could work if the docs are updated to reflect repo reality.

---

## Current status
No code changes have been applied yet. This report documents what must be fixed to satisfy the task.

