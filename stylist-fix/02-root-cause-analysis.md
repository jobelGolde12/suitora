# Root Cause Analysis

This document explains *why* the bugs in `01-bug-inventory.md` happened, how they
interact, and why the testing workflow did not catch them.

---

## 1. The phantom "setInput crash" (BUG-007) — where the report went wrong

### What was reported

```
Error Type: Console Error
Error Message: Internal server error
Location: handleSend at components/stylist/StylistChat.tsx:84:14
  82 |     setMessages((prev) => [...prev, optimistic]);
  83 |     setInput("");
> 84 |     setInput("");     ← Error occurs here
```

### Technical root cause of the misreport

- A client-side React state update (`setInput("")`) **cannot** throw "Internal server
  error". That string is produced by the server funnel
  (`lib/api/response.ts` → `handleError`) or the route's own catch block returning
  `apiError("Internal server error", 500)`.
- The reported code frame shows `setInput("")` twice on lines 82–84. No version of
  `StylistChat.tsx` ever contained two consecutive `setInput("")` calls, and the
  pre-fix line 84 was `setIsSending(true)`. The frame is inconsistent with the codebase.
- The real chain that produces the observed console output is:
  1. `POST /api/stylist` returns 500 with body `{ error: "Internal server error" }`
     (or an HTML error page, in which case `res.json()` itself throws).
  2. `handleSend` executes `throw new Error(data?.error || "Failed to get a reply")`
     at the `await fetch` line.
  3. The error escapes as an unhandled rejection, and dev tools attribute it to the
     nearest async frame — which is `handleSend` inside `StylistChat.tsx`.
  4. The report then misattributed the server error message to the *next line* of
     source (`setInput`), producing a convincing-but-false stack.

### Why this matters

The subsequent "fix" (`setInput(input !== undefined && input !== null ? input : "")`)
was written to protect `setInput` from an attack surface that does not exist. It
silently broke the composer clearing (BUG-001) while leaving the actual failure mode
(API 500s) untouched.

**Lesson**: when a client console error shows a server-style message, trace the fetch
call — the bug is almost always in how the API response is handled, not in the line the
browser points at.

---

## 2. Build-blocking breakage (BUG-002, BUG-003, BUG-004)

### Technical root cause

- `tsconfig.json` includes `**/*.ts` and `**/*.tsx` with only `node_modules`
  excluded. The `stylist-fix/` reference files are therefore part of the typechecked
  project, but they were edited without running the typecheck.
- The previous remediation session made structural edits (extra `</div>` in the
  production component, broken `</Link`/`</button` tags in the reference component,
  missing imports in the utils file) and never validated them.

### Architectural issue

There is no gate between "writing a fix" and "the build": `npx tsc --noEmit` is only
run manually, and the reference files under `stylist-fix/` are easy to forget about
because they are not imported by the app.

### Missing safeguard

A CI/typecheck step (`tsc --noEmit` + `next build`) run on every change would have
caught all three bugs instantly. See `06-prevention-strategy.md`.

### Dependency chain

- BUG-004 (extra `</div>`) prevents `next build` from ever succeeding → app cannot
  deploy.
- BUG-002/003 would break the same typecheck the moment anyone ran it.
- All three were "free" to catch — they are mechanical, not architectural.

### Why testing missed it

The unit/integration suite (`vitest`) does not run the TypeScript compiler and never
imports the reference files; the route tests exercise the API, not the component. No
component test renders `StylistChat` (the repo has no jsdom / `@testing-library/react`),
so JSX structure errors are invisible to the test runner.

---

## 3. The composer-clearing regression (BUG-001)

### Technical root cause

`setInput(input !== undefined && input !== null ? input : "")` evaluates to
`setInput(input)` whenever a valid message exists (which is the only time `handleSend`
runs). Because `input` is the sent text, the composer is never cleared. The original
`setInput("")` was correct; the "defensive" check destroyed the behavior it wrapped.

### Missing safeguard

A functional assertion ("after send, input value === ''") would have caught this. The
test plan in `04-test-cases.md` (TC-CHAT-001 step 3) describes exactly this check but
no test harness exists to execute it.

---

## 4. Dead `isMounted` guard (BUG-005)

### Technical root cause

A mount guard is only useful if something can turn it off. The ref was initialized to
`true` and the effect set it to `true`; nothing ever set it to `false`, so
`if (!isMounted.current) return` was dead code. This is the classic "guard-shaped
decoration": the right shape, no working mechanism.

### Correct pattern

```tsx
useEffect(() => {
  isMounted.current = true;
  return () => {
    isMounted.current = false; // ← this was missing
  };
}, []);
```

Note: React 18/19 do not warn about `setState` on unmounted components, so the guard's
practical value is limited to skipping unnecessary work and toasts — but when a guard
exists, it should actually guard.

---

## 5. Persistence-ordering inconsistency (BUG-006)

### Technical root cause

`POST /api/stylist` writes the user message to the DB *before* generating the reply:

```
addStylistMessage(userId, "user", message)   // commit point 1
reply = generateStylistReply(...)             // can throw / be slow
addStylistMessage(userId, "assistant", reply) // commit point 2
```

The client, meanwhile, removes the optimistic message on any failure. The result is a
server/client split-brain: the server keeps the user message, the client drops it.

### Why it was not caught

The integration tests stub `generateStylistReply` to always resolve, so the "reply
fails after user write" path is never exercised. Adding a test that makes the stub
reject — and asserting no `addStylistMessage("user", ...)` call happens — would pin the
intended behavior.

### Fix direction (Phase 2)

Generate the reply first, then persist user+assistant together (or wrap both writes in
a transaction), so a failure leaves no orphaned message. This changes the existing test
assertions on call order, so it ships with its own test update.

---

## 6. Why the deep-test protocol found "no crash"

The prompt's Phase 1 protocol (state audit, event-handler paths, edge cases, error
states) was followed, but the critical finding is that the headline bug did not exist.
The real defects were:

| Found by | Defect |
|----------|--------|
| Static analysis + typecheck | BUG-002, BUG-003, BUG-004 (build blockers) |
| Code reading | BUG-001 (no-op clearing), BUG-005 (dead guard) |
| Failure-mode reasoning | BUG-006 (persistence ordering) |
| Behavioral observation | BUG-008, BUG-009 (polish/resource hygiene) |

This is the expected outcome of a deep test: half the work is disproving the reported
symptom, the other half is finding the defects that report was masking.

---

## 7. The runtime 500 confirmed and fixed (BUG-010)

After the static pass, a live console report of "Internal server error" at `handleSend`
was traced to its true source in the **remote database**:

1. `POST/GET /api/stylist` call query functions that filter with `notDeleted()`
   (`WHERE deleted_at IS NULL`).
2. The remote Turso DB never received `2026-08-06-add-soft-deletes.sql` (and
   `2026-08-06-add-backup-logs.sql`), so no table had a `deleted_at` column.
3. SQLite threw `no such column: deleted_at`; the route catch returned
   `apiError("Internal server error", 500)`; the client threw it at the `await fetch`
   line, producing the misattributed console frame.
4. `_suitora_migrations` tracking was empty, so `migrate.mjs` believed everything was
   pending and a naive run would have crashed on `0000`'s plain `CREATE TABLE`s.

### Why migration drift happened

The custom runner (`scripts/migrate.mjs`) tracks in `_suitora_migrations`, but the DB
was originally migrated before tracking existed (or tracking was reset), so the
migration record diverged from reality. The `0002_add-deleted-at-fields.sql` file is a
drizzle-generated catch-all that duplicates already-existing tables and would fail if
run against this DB — it must be baselined, never executed, going forward.

### The fix (applied and verified)

- Baselined 11 already-effective migrations into `_suitora_migrations` (idempotent).
- Applied the two genuinely missing migrations in a write transaction.
- Verified: `npm run db:status` shows all 13 applied; all stylist/context SQL runs clean.

### Prevention

- Add `npm run db:status` (or a schema-drift check) to CI/deploy so "pending"
  migrations are surfaced before they become runtime 500s.
- Prefer `CREATE TABLE IF NOT EXISTS` / idempotent `ALTER` guarded by `pragma_table_info`
  checks in future migrations, and keep `_suitora_migrations` in sync with every apply.
- If drizzle-generated catch-all migrations (`0002_*.sql`) are not used, remove them
  rather than leaving landmines in the migration folder.
