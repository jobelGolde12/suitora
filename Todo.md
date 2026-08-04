You are a senior product designer and front-end engineer. Refactor the "Try It On"
upload section below so the two columns are perfectly level and the design,
micro-interactions, and functionality reach production quality.

HARD CONSTRAINT — DO NOT CHANGE THE THEME:
Preserve the existing editorial aesthetic exactly: warm cream page background,
off-white dashed-border surfaces, muted caramel/tan accent, circular beige icon
badges, serif display heading ("Try It On"), letter-spaced uppercase eyebrow
("CREATE"), quiet gray sans body text, soft radii, generous whitespace.
No new hues, no new font families, no gradients, no glassmorphism, no dark mode.

──────────────────────────────
1. FORMALIZE DESIGN TOKENS (extract from current UI, use everywhere)
──────────────────────────────
Define CSS custom properties and reference them in every rule:
- --bg: #F2F0EB; --surface: #F7F6F2; --border-dashed: #DAD3C8
- --ink: #2B2926; --ink-muted: #8A857C; --ink-faint: #B3ADA3
- --accent: #B4835C; --badge: #E7DFD5; --error: #B4593C (muted terracotta)
- Radii: --r-lg: 20px (dropzones), --r-md: 12px, --r-full: 999px
- Spacing on an 8pt scale (8/16/24/32/40/48); icon stroke 1.5px everywhere
- Type scale: eyebrow 11px/ls .18em/uppercase/accent; H1 serif clamp(2.2rem,4vw,3rem);
  subtitle 16px muted; column label 17px semibold; zone title 16px semibold;
  helper 13.5px muted; meta 12px faint

──────────────────────────────
2. LEVEL THE TWO-COLUMN LAYOUT (primary fix)
──────────────────────────────
Current defect: the right column's segmented control ("Upload Image / Paste URL")
adds vertical mass, so the right dropzone starts ~100px lower than the left and
the cards end at different heights. Fix with a shared row structure:
- Parent: display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:stretch
- Each column: display:grid; grid-template-rows:auto auto 1fr; row-gap:16px
  • Row 1 = header (icon badge + label). Both headers must share one baseline;
    badges identical size (40px), icons optically centered.
  • Row 2 = control strip (fixed 44px tall). Right column keeps the segmented
    control here. Left column gets a *balancing element of the same height* so
    the space adds value instead of dead air — e.g. a quiet 13px muted hint chip:
    "Full-body, well-lit photos work best" or "Photos stay private".
  • Row 3 = dropzone with height:100% so both zones are equal-height at all
    breakpoints. Same min-height (440px desktop / 320px mobile), same padding
    (32px), same radius and border on both sides.
Acceptance: top edges, control rows, and bottom edges of both cards align
within 1px at 1440 / 1024 / 768 / 390 widths.

──────────────────────────────
3. POLISH THE SEGMENTED CONTROL
──────────────────────────────
- Track: bg #ECE7DF, radius full, padding 4px, height 44px
- Active pill: #FBFAF7, radius full, shadow 0 1px 2px rgba(0,0,0,.06);
  animate a sliding indicator with transform, 200ms cubic-bezier(.4,0,.2,1)
- Inactive label --ink-muted, active label --ink; 16px icons
- focus-visible: 2px accent ring, offset 2px

──────────────────────────────
4. DROPZONE STATES & MICRO-INTERACTIONS (affordance + feedback)
──────────────────────────────
- Default: 1.5px dashed --border-dashed, bg --surface
- Hover: border → accent @40%, bg tint #FAF7F2, badge icon scale 1.06,
  cursor:pointer, 160ms ease transitions
- Dragover: solid accent border, accent 6% background tint, card scale 1.01,
  swap icon to a "drop" affordance (arrow-into-tray)
- Focus-visible mirrors hover + ring; zone is keyboard-operable
  (role="button", tabindex=0, Enter/Space opens file dialog; hidden
  <input type="file" accept="image/jpeg,image/png,image/webp">)
- Inner stack identical on both sides: 64px badge circle → title → helper →
  meta, gaps 12/8/16; honor prefers-reduced-motion on all animation

──────────────────────────────
5. REAL UPLOAD FUNCTIONALITY
──────────────────────────────
- Validate type (JPG/PNG/WEBP) and size (≤5MB); inline dismissible error banner
  inside the zone using --error with a 14px icon; aria-live="polite" for errors/success
- On success: replace dashed zone with a preview card (image cover, inherited
  radius, filename + size row, ghost actions "Replace" / "Remove", 32px tall);
  reserve height so there is zero layout shift (CLS = 0)
- Support paste-from-clipboard images on the left zone (paste event)
- URL tab: 44px input (1px solid --border-dashed, focus → accent border) +
  "Fetch" button; loading spinner in accent; success renders the same preview
  card; failure shows the error state

──────────────────────────────
6. COMPLETION PATH
──────────────────────────────
- Below the grid, centered primary CTA "See How It Fits →": accent bg, cream
  text, radius full, padding 14px 28px; disabled (until both sides valid) =
  40% opacity + not-allowed; on enable, subtle 240ms fade/slide-in

──────────────────────────────
7. RESPONSIVE & ACCESSIBILITY
──────────────────────────────
- ≤900px: single column (Self first), control strip and CTA full-width,
  dropzone min-height 320px
- Section wrapper: one shared max-width (~1160px) + padding-inline 24–32px so
  eyebrow/H1/subtitle align exactly with the left card edge
- Text contrast ≥ WCAG AA; logical DOM order; labels tied via aria-labelledby

──────────────────────────────
8. QA CHECKLIST BEFORE YOU FINISH
──────────────────────────────
[ ] Both cards level (top, control row, bottom) at 1440/1024/768/390
[ ] No theme drift: only token colors/fonts used
[ ] All states implemented: default/hover/dragover/focus/loading/error/success/disabled
[ ] No CLS on upload; reduced-motion respected; keyboard flow works end-to-end

DELIVERABLE: updated component code + tokens file + a short changelog
explaining each change and the design rationale behind it.