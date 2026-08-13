# AI Stylist Fix Plan

Prioritized remediation plan based on the evidence in `01-bug-inventory.md` and
`02-root-cause-analysis.md`. Phases 1–2 are implemented and verified in this pass;
Phase 3 items are documented with ready-to-apply guidance.

---

## Phase 1: Critical Fixes — build-blockers (shipped immediately)

### 1.1 Fix `StylistChat.tsx` JSX structure — BUG-004

- **Files**: `components/stylist/StylistChat.tsx`
- **Change**: Remove the extra `</div>` in the `messages.map` callback so each message
  renders a single root element.
- **Before**:
  ```tsx
                )}
              </div>   {/* ← extra */}
            </div>
  ```
- **After**:
  ```tsx
                )}
            </div>
  ```
- **Testing**: `npx tsc --noEmit` (was TS2657/TS1005/TS1109 before).
- **Deployment**: None beyond a normal deploy; without this the app cannot build.

### 1.2 Fix `error-handling-utils.ts` compile errors — BUG-002

- **Files**: `stylist-fix/05-code-fixes/error-handling-utils.ts`
- **Change**: Import `type StylistMessageInput` from `@/lib/ai/stylist`, `requireUser`
  from `@/lib/auth/session`, `stylistRateLimiter` from `@/lib/rate-limit`; remove the
  stray `"use server"` directive (the module is imported by route handlers, not used as
  server actions).
- **Before**:
  ```ts
  "use server";
  import { generateStylistReply } from "@/lib/ai/stylist";
  import { StylistContext } from "@/lib/ai/stylist";
  import { enforceRateLimit } from "@/lib/rate-limit";
  ```
- **After**:
  ```ts
  import { requireUser } from "@/lib/auth/session";
  import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
  import {
    generateStylistReply,
    type StylistContext,
    type StylistMessageInput,
  } from "@/lib/ai/stylist";
  ```
- **Testing**: `npx tsc --noEmit`.
- **Deployment**: None.

### 1.3 Fix `stylist-chat-fix.tsx` malformed JSX — BUG-003

- **Files**: `stylist-fix/05-code-fixes/stylist-chat-fix.tsx`
- **Change**: Rewrote the reference component to mirror the verified production
  component (fixes `</Link` / `</button` unclosed tags).
- **Testing**: `npx tsc --noEmit`.

**Effort (Phase 1)**: ~1–2 hours (mostly verification).
**Risk**: Very low — mechanical structural fixes with a green typecheck.

---

## Phase 2: Stability Improvements (shipped in this pass)

### 2.1 Restore composer clearing — BUG-001

- **Files**: `components/stylist/StylistChat.tsx`,
  `stylist-fix/05-code-fixes/stylist-chat-fix.tsx`
- **Change**: Replace the no-op guard with a plain `setInput("")`.
- **Before**:
  ```tsx
  setInput(input !== undefined && input !== null ? input : "");
  ```
- **After**:
  ```tsx
  // Clear the composer so the sent message is not left in the input.
  setInput("");
  ```
- **Testing**: Manual — send a message and confirm the textarea clears; run the test
  suite for regressions.
- **Deployment**: None.

### 2.2 Make the mount guard real — BUG-005

- **Files**: `components/stylist/StylistChat.tsx`
- **Change**: Add the effect cleanup that flips `isMounted.current` to `false` on
  unmount, and guard the async `.catch`/`.finally` callbacks and `handleSend` state
  updates.
- **Before**:
  ```tsx
  useEffect(() => {
    isMounted.current = true;
    fetch(...).then(...).catch(...).finally(() => setIsLoading(false));
  }, [addToast]);
  ```
- **After**:
  ```tsx
  useEffect(() => {
    isMounted.current = true;
    fetch(...).then(...)
      .catch(() => { if (isMounted.current) addToast(...); })
      .finally(() => { if (isMounted.current) setIsLoading(false); });
    return () => { isMounted.current = false; };
  }, [addToast]);
  ```
- **Testing**: Manual — send a message and navigate away before the reply; no console
  errors / stray toasts. Typecheck.
- **Deployment**: None.

### 2.3 API resilience — BUG-006 (recommended next)

- **Files**: `app/api/stylist/route.ts`, `tests/integration/stylist.route.test.ts`
- **Change**: Generate the reply before persisting, then persist user + assistant
  together so a failed generation leaves no orphaned user message. Update the
  integration test that asserts `addStylistMessage` call order, and add a test where
  `generateStylistReply` rejects and asserts the user message is **not** written.
- **Testing**: Extend `tests/integration/stylist.route.test.ts` with the rejection
  case; run `npx vitest run tests/integration/stylist.route.test.ts`.
- **Deployment**: Behavior change on the error path only; happy path responses are
  identical.
- **Effort (Phase 2)**: ~2–4 hours (2.1–2.2 landed; 2.3 is scoped).
- **Risk**: Low for 2.1/2.2. 2.3 is medium because it changes DB write order and test
  assertions.

---

## Phase 3: UX Polish (documented, not yet applied)

### 3.1 Responsive height — BUG-008
- Track `isMobile` with a `matchMedia` listener (`useMediaQuery` hook exists at
  `hooks/useMediaQuery.ts`) instead of computing it inline on every render.
- **Effort**: ~1 hour. **Risk**: Low.

### 3.2 Request cancellation — BUG-009
- Use an `AbortController` per request; abort in the unmount cleanup. Pass the signal
  to `fetch` for both the history load and `handleSend`.
- **Effort**: ~1–2 hours. **Risk**: Low.

### 3.3 Accessibility & UX
- Keep `aria-live="polite"` (already present), add `aria-busy` while `isSending`, and
  an `aria-label` on the typing indicator. Move focus to the composer after a
  suggested-prompt send.
- **Effort**: ~2 hours. **Risk**: Low.

### 3.4 Component test harness
- Add `jsdom` + `@testing-library/react` and a `StylistChat.test.tsx` covering
  TC-CHAT-001…008 from `04-test-cases.md`. This is the single highest-leverage test
  investment because no component test exists today.
- **Effort**: ~4–8 hours. **Risk**: Low (dev-only deps).

---

## Estimated Total Effort

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Build-blockers | 1–2 h |
| 2 | Stability (2.1–2.2 done; 2.3 pending) | 2–4 h |
| 3 | UX polish + component test harness | 8–13 h |
| **Total** | | **11–19 h** |

---

## Deployment Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| JSX/import fixes (Phase 1) | Very low | Green `tsc --noEmit`; app cannot build without them |
| `setInput("")` clearing (2.1) | Low | One-line behavioral fix; manual smoke test on staging |
| Mount-guard cleanup (2.2) | Low | Only affects post-unmount callbacks; no-ops if skipped |
| API persistence order (2.3) | Medium | Update integration tests in the same PR; verify happy path unchanged |
| Polish + test harness (Phase 3) | Low | Dev-only deps; feature-flagged where relevant |

**Recommended deploy order**: Phase 1 + 2 in one release (they are interdependent:
2.1/2.2 live in the same file as 1.1). Phase 3 items ship independently.

## Success Criteria Checklist

- [x] `npx tsc --noEmit` passes with zero errors
- [x] Stylist API integration tests pass (`tests/integration/stylist.route.test.ts`)
- [x] Stylist AI unit tests pass (`lib/ai/stylist.test.ts`)
- [x] Composer clears after sending (BUG-001 verified by code review)
- [x] Mount guard has a working cleanup (BUG-005)
- [ ] BUG-006 persistence-order fix applied + tested
- [ ] Component test harness added (Phase 3.4)
- [ ] Cypress e2e spec for the stylist page added
