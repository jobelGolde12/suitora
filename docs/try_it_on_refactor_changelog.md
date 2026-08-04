# Try It On — Section Refactor Changelog

**Page:** `app/(dashboard)/upload/page.tsx`
**New tokens + styles:** `app/tryon-tokens.css` (imported by `app/globals.css`)
**Date:** Aug 2026

This refactor levels and polishes the two-column "Try It On" upload without
changing the editorial theme. All styling is scoped under `.try-on`, so the
global design system is untouched.

---

## 1. Formalized design tokens

Extracted the existing warm-cream / caramel / beige aesthetic into scoped CSS
custom properties (`--t-*`) referenced by every rule: background, surface,
dashed border, ink/muted/faint text, accent, badge, error, radii (20/12/999),
an 8pt spacing scale, and motion tokens (200ms, `cubic-bezier(.4,0,.2,1)`).
No new hues, no new fonts (reuses the Cormorant heading + Inter body already
loaded), no gradients, no glass, no dark mode.

## 2. Leveled the two-column layout (primary fix)

- Shared `1fr 1fr` grid, `40px` gap, `align-items: stretch`.
- Each column is now `grid-template-rows: auto auto 1fr`:
  - **Row 1** = header (40px badge + label); badges identical, headers share a baseline.
  - **Row 2** = fixed **44px** control strip. Right keeps the segmented control;
    left gets a *balancing* "Full-body, well-lit photos work best" hint chip so
    the space adds value instead of dead air.
  - **Row 3** = dropzone / preview / URL card with `height: 100%` and the same
    `min-height: 440px` (320px mobile) on both sides — so top edges, control
    rows, and bottom edges align within 1px at 1440/1024/768/390.
- Section wrapper: shared `max-width: 1160px` + `padding-inline 24–32px` so the
  eyebrow/H1/subtitle align exactly with the left card edge.

## 3. Segmented control

Track `#ECE7DF`, full-radius, 44px; an absolutely-positioned active pill
(`#FBFAF7`, soft shadow) slides via `transform: translateX(100%)` with 200ms
`cubic-bezier(.4,0,.2,1)`; inactive/active label color swap; 2px accent focus
ring. This replaces the old single-pill-repaint control.

## 4. Dropzone states & micro-interactions

Default (1.5px dashed, surface) → hover (accent @40% border, `#FAF7F2` tint,
badge `scale(1.06)`, pointer, 160ms) → dragover (solid accent border, accent 6%
tint, `scale(1.01)`, icon swaps to a tray/drop affordance) → focus-visible
(mirrors hover + 2px accent ring). Zones are `role="button"`, `tabIndex 0`,
Enter/Space open the hidden `<input type="file">`. Identical inner stack on both
sides: 64px badge → title → helper → meta (gaps 12/8/16). `prefers-reduced-motion`
disables all transition/animation.

## 5. Real upload functionality

- Validate type (JPG/PNG/WEBP) and ≤5MB; inline **dismissible** error banner in
  `--error` with a 14px icon; `role="alert"` + a visually-hidden `aria-live`
  region announce errors and readiness.
- Success replaces the dashed zone with a preview **card** (image cover, inherited
  radius, filename + size, 32px "Replace"/"Remove" ghost actions). The preview
  reserves the same height as the zone → **zero layout shift (CLS = 0)**.
- Paste-from-clipboard images supported on the left (Self) zone.
- URL tab: 44px input (focus → accent border, `aria-invalid` on error) + accent
  "Fetch" button with spinner; success shows the same preview card; failure shows
  the error state.

## 6. Completion path

Centered primary CTA "See How It Fits →": accent bg, cream text, full radius,
`14px 28px` padding; `disabled` = 40% opacity + `not-allowed`; a 240ms opacity/
transform transition produces the subtle fade/slide-in on enable.

## 7. Responsive & accessibility

- ≤900px: single column (Self first), control strip and CTA full-width, dropzone
  `min-height 320px`.
- Logical DOM order, zone labels tied via `aria-labelledby`, keyboard flow works
  end-to-end, touch targets ≥44px, token colors chosen for WCAG AA body contrast.

---

## QA checklist

| Item | Status |
|------|--------|
| Both cards level (top / control row / bottom) at 1440·1024·768·390 | ✅ shared row-grid + equal 440px zones |
| No theme drift — only token colors/fonts used | ✅ scoped `.try-on` tokens |
| All states: default/hover/dragover/focus/loading/error/success/disabled | ✅ |
| No CLS on upload; reduced-motion respected; keyboard flow works | ✅ |
| Gates: lint / tsc / build / test | ✅ 0 errors / clean / build OK / 55 tests |

> **Note on URL "Fetch":** the analysis backend performs the real product
> extraction on submit (existing `POST /api/analysis` flow is preserved). The
> client Fetch is a soft validation + readiness gate that renders the same
> preview card; the preview uses a branded placeholder tile rather than loading
> arbitrary third-party URLs as `<img>` (avoids CORS/SSRF and broken-image
> states). All `AnalysisRequest` payload wiring is unchanged.
