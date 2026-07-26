# Suitora Landing Page — UI Enhancement Plan

> **Constraint:** Do **not** change the theme, color system, typography stack, or overall editorial identity defined in `premium-editorial-ui.md`.  
> **Goal:** Raise polish, hierarchy, motion quality, and modern interaction patterns so the landing feels closer to Apple / Linear / Aesop-level craft while remaining unmistakably Suitora.

**Source files reviewed**

| File | Role |
|------|------|
| `components/landing/Hero.tsx` | Full-viewport headline + CTAs + social proof |
| `components/landing/Features.tsx` | 6 feature cards |
| `components/landing/HowItWorks.tsx` | 4-step process |
| `components/landing/ScrollSection.tsx` | Scroll-linked fly-in section |
| `components/landing/FAQ.tsx` | Accordion FAQ |
| `components/landing/CTA.tsx` | Closing conversion block |
| `components/landing/index.ts` | Barrel exports |
| `app/(landing)/page.tsx` | Page composition order |

---

## 1. Design Principles for This Pass (Theme-Safe)

Stay inside the existing system:

- Warm neutrals, accent (`text-accent`), soft borders (`border-border`), card surfaces (`bg-card`)
- `font-heading` for display, light body weights, generous tracking on labels
- Framer Motion with the shared ease `[0.21, 0.47, 0.32, 0.98]`
- Rounded-full primary buttons, soft hover lift, no saturated colors
- Large whitespace, editorial section rhythm (`py-32 sm:py-40`)

Enhance through:

- Stronger visual hierarchy and rhythm
- Better use of imagery / product context (without inventing a new palette)
- Micro-interactions and scroll choreography that feel intentional
- Clearer conversion paths and trust signals
- Accessibility and responsive refinements
- Small structural additions that modern premium sites use (sticky nav awareness, trust bar, social proof, optional testimonial strip)

---

## 2. Current State Assessment

### Strengths
- Clean editorial voice and consistent motion language
- Good section labeling (`Features`, `How It Works`, `FAQ`)
- Feature cards and FAQ already follow soft border + hover elevation
- HowItWorks has a desktop connection line
- ScrollSection introduces a distinctive scroll moment

### Gaps vs. modern premium landing pages
1. **Hero** is text-only — no product/visual anchor, no secondary proof beyond avatar placeholders
2. **Features** cards are equal weight; no featured/hero feature or visual differentiation
3. **HowItWorks** is icon + text only; missing progressive visual (mock UI, phone frame, or step imagery)
4. **ScrollSection** depends on `ScrollFlyIn`; needs tighter integration with Suitora imagery and reduced risk of layout jump
5. **FAQ** works but lacks keyboard polish details and “still have questions?” micro-CTA
6. **CTA** is minimal; no secondary path, no trust line under the button
7. No **social proof / logos / testimonials** band between sections
8. No **sticky/compact nav treatment** awareness on scroll (owned by layout, but landing should coordinate)
9. Limited **responsive refinement** for very large and very small screens
10. Repeated motion variant definitions across files (DRY opportunity without visual change)

---

## 3. Enhancement Plan by Section

### 3.1 Hero (`Hero.tsx`)

**Purpose of changes:** Make the first screen feel product-led and trustworthy without altering the calm editorial tone.

| Enhancement | Detail | Theme-safe? |
|-------------|--------|-------------|
| Add optional visual panel | Soft product / try-on mock on the right (desktop) or under headline (mobile): muted fashion imagery or abstract score UI using existing `bg-card`, `border-border`, `text-accent` | Yes |
| Refine social proof | Replace empty gradient circles with real initials or subtle monogram avatars; add a second line (“Avg. compatibility insight in under 30s”) | Yes |
| Micro-interaction on primary CTA | Subtle scale or arrow nudge on hover (already has ArrowRight — animate translate on hover) | Yes |
| Scroll indicator | Keep, but add `aria-hidden` and ensure it doesn’t trap focus | Yes |
| Headline hierarchy | Keep current copy; optionally split second line for better `text-balance` on mid widths | Yes |
| Trust strip under CTAs | Tiny row: “No credit card · Private by design · Works with any store” using `text-muted` and small icons | Yes |

**Do not:** Change headline font weight to bold, add bright gradients, or enlarge buttons beyond current `size="lg"` editorial style.

**Implementation notes**
- Prefer CSS grid `lg:grid-cols-2` only if a visual is added; otherwise keep centered layout
- Use `next/image` for any static assets under `public/`
- Motion: keep existing `stagger` / `fadeInUp`; delay visual slightly after text

---

### 3.2 Features (`Features.tsx`)

**Purpose:** Increase scanability and perceived depth while keeping the 6-card grid.

| Enhancement | Detail |
|-------------|--------|
| Section intro | Already strong — tighten max-width of subtitle if needed |
| Card elevation system | Default: `border-border/60`; hover: `border-accent/30` + `shadow-elevated` (already present). Add very subtle `bg-surface/30` on hover for depth |
| Icon treatment | Keep circular border; on hover, soft `bg-accent/10` fill behind icon |
| Featured card (optional) | Make the first card span 2 columns on `lg` **or** keep equal grid and instead add a thin top accent line on hover only |
| Stagger polish | Use single `whileInView` parent with staggered children instead of per-card viewport observers (smoother, fewer observers) |
| Copy micro-edit | Ensure each description ends with a clear benefit (already mostly true) |

**Do not:** Switch to dense icon grids, colored card backgrounds, or 4-column cram on desktop.

---

### 3.3 How It Works (`HowItWorks.tsx`)

**Purpose:** Make the 4-step flow feel more guided and modern.

| Enhancement | Detail |
|-------------|--------|
| Step visual | Optional small monochrome illustration or numbered timeline marker with stronger hierarchy |
| Connection line | Keep gradient line; animate draw-in on scroll (`scaleX` from 0 → 1) for a modern touch |
| Active step hint | On scroll into view, briefly emphasize the current step (border or icon scale) then settle — tasteful, not a carousel |
| Copy alignment | Headline says “Three simple steps” but there are **four** steps — fix copy to “Four simple steps…” or reduce to three if product prefers |
| Mobile | Stack with left border timeline instead of only vertical cards for clearer sequence |

**Do not:** Turn this into a heavy horizontal carousel or add loud step numbers.

---

### 3.4 Scroll Section (`ScrollSection.tsx`)

**Purpose:** Keep the distinctive scroll moment; make it more on-brand and robust.

| Enhancement | Detail |
|-------------|--------|
| Imagery | Ensure `ScrollFlyIn` uses a Suitora-relevant image (fashion, try-on, soft lifestyle) hosted in `public/` or CDN — not a generic jet |
| Copy | Already on-brand; keep italic accent phrase |
| Height / layout | Audit `h-[200vh]` behavior on mobile; reduce or disable heavy parallax on small screens if it harms UX |
| Reduced motion | Respect `prefers-reduced-motion`: fall back to static centered content |
| Integration | Add soft top/bottom fade so the section doesn’t hard-cut against Features / FAQ |

---

### 3.5 FAQ (`FAQ.tsx`)

**Purpose:** Polish interaction and accessibility; improve conversion after questions.

| Enhancement | Detail |
|-------------|--------|
| Single-open accordion | Already single-open via `openIndex` — keep |
| Keyboard | Ensure `button` has visible focus ring consistent with design system |
| Animation | Prefer height animation via Framer `AnimatePresence` + measured height, or keep CSS grid-rows but add `aria-expanded` |
| a11y | Add `aria-expanded`, `aria-controls`, and region id per panel |
| After FAQ | Small line: “Still unsure?” + text link to register or contact — same muted style |
| Hover | Keep soft border accent; avoid background jumps |

---

### 3.6 CTA (`CTA.tsx`)

**Purpose:** Strengthen close without looking salesy.

| Enhancement | Detail |
|-------------|--------|
| Secondary action | Ghost button “See how it works” linking to `#how-it-works` |
| Trust line | Under buttons: “Free to start · Cancel anytime · Your photos stay private” |
| Background | Keep `bg-surface/40`; optional very soft radial accent glow using existing accent at 5–8% opacity |
| Motion | Keep stagger; ensure section doesn’t feel empty on ultrawide (max-w is fine) |

---

### 3.7 Cross-Section / Page-Level

| Enhancement | Where | Detail |
|-------------|-------|--------|
| Shared motion tokens | New `components/landing/motion.ts` | Export `easeOut`, `fadeInUp`, `stagger` once; import everywhere |
| Section spacing rhythm | All sections | Keep `py-32 sm:py-40`; ensure consistent horizontal `px-6` |
| Trust / logo bar (optional new) | Between Hero and Features | Thin row of “As seen in” or category pills (Dresses · Shoes · Streetwear) — no new colors |
| Testimonial strip (optional) | Between HowItWorks and ScrollSection or before CTA | 1–3 short quotes in editorial cards; if no real quotes yet, skip rather than invent |
| Nav scroll state | `components/layout/Navbar.tsx` | On landing, add scrolled compact state (background blur / border) — coordinate only, don’t restyle brand |
| Deep links | Features, HowItWorks, FAQ | Already have ids — ensure Navbar links match |
| SEO / semantic | Page | One `h1` in Hero only; sections use `h2`; FAQ questions as `h3` or keep button text with proper aria |

---

## 4. New or Extended Files (No Theme Change)

| Path | Action | Purpose |
|------|--------|---------|
| `components/landing/motion.ts` | **New** | Shared Framer variants & easing |
| `components/landing/Hero.tsx` | Extend | Visual panel, trust strip, CTA micro-motion |
| `components/landing/Features.tsx` | Extend | Hover depth, staggered parent, icon hover |
| `components/landing/HowItWorks.tsx` | Extend | Copy fix, line draw, mobile timeline |
| `components/landing/ScrollSection.tsx` | Extend | Brand image, reduced-motion, fades |
| `components/landing/FAQ.tsx` | Extend | a11y attrs, post-FAQ micro-CTA |
| `components/landing/CTA.tsx` | Extend | Secondary CTA + trust line |
| `components/landing/TrustBar.tsx` | **New (optional)** | Category or social-proof strip |
| `components/landing/index.ts` | Extend | Export new pieces |
| `app/(landing)/page.tsx` | Extend | Insert optional TrustBar order |
| `public/images/landing/` | **New assets** | Hero visual, scroll section image (warm, editorial photography) |

**Do not create** a parallel design system, new color tokens, or alternate button variants beyond existing `editorial` / `ghost`.

---

## 5. Motion & Interaction Guidelines (Keep Existing Language)

- Primary easing: `[0.21, 0.47, 0.32, 0.98]`
- Entrance: opacity + small `y` (20–30px), duration 0.6–0.8s
- Hover: `y: -4` or soft shadow; icon containers may gain `bg-accent/10`
- Scroll reveals: `whileInView` + `viewport={{ once: true, margin: "-80px" }}`
- Respect `prefers-reduced-motion: reduce` → disable parallax / continuous bounce
- No scroll-jacking; ScrollSection must remain optional enhancement

---

## 6. Accessibility Checklist (Apply During Enhancement)

- [ ] Single `h1` on the page (Hero)
- [ ] FAQ buttons expose `aria-expanded` and control panel ids
- [ ] Focus rings visible on all interactive elements (use existing focus styles)
- [ ] Decorative scroll chevron and any scroll-fly imagery marked decorative
- [ ] Color contrast remains WCAG AA on muted text
- [ ] Touch targets ≥ 44px on mobile CTAs and FAQ rows
- [ ] Reduced-motion fallback for ScrollSection and continuous animations

---

## 7. Responsive Behavior

| Breakpoint | Expectations |
|------------|--------------|
| &lt; 640px | Centered stacks; Hero CTAs full-width or stacked; HowItWorks vertical timeline; Features 1-col |
| 640–1024px | Features 2-col; HowItWorks 2×2 or horizontal with shorter line |
| ≥ 1024px | Features 3-col; HowItWorks 4-col with connection line; optional Hero split layout |
| Ultrawide | Keep `max-w-5xl` / `max-w-6xl` so content doesn’t stretch thin |

Preserve editorial spacing — do not collapse `py-32` aggressively on mobile; slight reduction to `py-24` is acceptable if needed.

---

## 8. Implementation Order

1. **Extract** `motion.ts` and switch all landing components to shared variants (no visual change — pure cleanup).
2. **Fix** HowItWorks “three vs four steps” copy.
3. **Polish** FAQ a11y + micro-CTA.
4. **Enhance** CTA (secondary action + trust line).
5. **Deepen** Features card hover / icon states.
6. **Upgrade** Hero (trust strip → optional visual panel).
7. **Harden** ScrollSection (image, reduced-motion, fades).
8. **Optional** TrustBar / testimonial strip if real content exists.
9. **Pass** full responsive + a11y review against the checklist above.
10. **Update** `docs/welcome_page_design_plan.md` if section structure or content changes.

---

## 9. Success Criteria

- Theme tokens, fonts, and overall “premium editorial” feel are unchanged
- Landing feels more intentional: clearer hierarchy, better trust, smoother motion
- No new color palette or competing visual language
- All interactive elements are keyboard-accessible
- Mobile experience remains calm and readable
- ScrollSection no longer risks jank or off-brand imagery
- Copy is consistent (step count, claims, CTAs)

---

## 10. Out of Scope (Explicitly)

- Replacing the design system or Tailwind tokens
- Adding dark-only experimental layouts
- Heavy 3D, Lottie spam, or autoplay video backgrounds
- Changing product positioning or primary CTA destinations without product approval
- Building real testimonials with fabricated quotes

---

## 11. Related Docs

- `premium-editorial-ui.md` — mandatory design rules
- `docs/welcome_page_design_plan.md` — Features / How It Works content plan
- `docs/dashboard_feature_flow.md` — how landing features map to product
- `components/landing/*` — implementation targets

---

*Enhance craft, not identity. Every change should make Suitora feel more premium while still looking like Suitora.*
