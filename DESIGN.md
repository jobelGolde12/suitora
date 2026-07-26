# Suitora — Design System Specification

## §1 Objective

Suitora is a premium fashion compatibility platform. The landing page must feel like opening a well-designed fashion magazine — calm, confident, editorial — not like a SaaS template. The core question: "Will this actually look good on me?" is answered with the same calm authority the design itself projects.

**Design target:** Apple / Linear / Aesop-level craft. Warm, not cold. Editorial, not corporate. Premium, not flashy.

---

## §2 Product Context

- **Product:** AI fashion compatibility analyzer — users upload a photo + clothing item, get body fit, color harmony, and style match scores
- **Audience:** Style-conscious shoppers (25–45), mobile-first, value quality over trend
- **Brand voice:** Calm, direct, slightly editorial. Never salesy. Never urgent.
- **Competing against:** Generic fashion apps, "does this look good" guesswork, expensive personal shoppers

---

## §3 Visual Foundations

### Palette
- **Background:** `bg-background` (warm off-white)
- **Card surfaces:** `bg-card` (soft white)
- **Accent:** `text-accent` / `bg-accent` (warm muted — used sparingly for emphasis)
- **Borders:** `border-border` (soft, not harsh)
- **Muted text:** `text-muted` (calm gray, never black)
- **Surface tint:** `bg-surface/40` (alternating section backgrounds)

### Typography
- **Display/headings:** `font-heading` — light weight, generous tracking (`tracking-tight`), `text-balance` for wrapping
- **Body:** Light weight (`font-light`), generous leading (`leading-relaxed`)
- **Labels:** `text-xs uppercase tracking-[0.2em]` — always accent-colored
- **Scale:** 5xl → 6xl → 7xl → 8xl for hero; 4xl → 5xl for section headings

### Spacing & Rhythm
- **Section padding:** `py-32 sm:py-40` — generous vertical rhythm
- **Horizontal:** `px-6` consistent
- **Content max-width:** `max-w-5xl` / `max-w-6xl` — never stretches thin
- **Card padding:** `p-8` default

### Motion
- **Primary easing:** `[0.21, 0.47, 0.32, 0.98]`
- **Entrance:** opacity + y (20–30px), duration 0.6–0.8s
- **Hover:** `y: -4` or soft shadow elevation
- **Scroll reveals:** `whileInView` + `viewport={{ once: true, margin: "-80px" }}`
- **Reduced motion:** Respect `prefers-reduced-motion: reduce`

### Buttons
- **Primary:** `variant="editorial"` — rounded-full, soft hover lift
- **Secondary:** `variant="ghost"` — outlined, no background fill
- **Size:** `size="lg"` for hero/CTA, `size="sm"` for secondary actions

---

## §4 Accessibility

- Single `h1` on the page (Hero only)
- FAQ: `aria-expanded`, `aria-controls`, region ids
- Focus rings visible on all interactive elements
- Decorative elements marked `aria-hidden`
- WCAG AA contrast on all text
- Touch targets ≥ 44px on mobile
- Reduced-motion fallback for ScrollSection

---

## §5 Voice & Tone

- Direct, not clever
- Calm, not urgent
- Editorial, not corporate
- Never "seamlessly unlock your potential"
- Trust is earned through specificity, not exclamation marks

---

## §6 Implementation Practices

- Next.js App Router with Server Components by default
- Client components only for interactive elements (motion, FAQ, modals)
- Framer Motion for all animations
- Tailwind CSS with existing design tokens
- No new color tokens — extend within existing system
- `next/image` for all static assets

---

## §7 Anti-Patterns (Avoid)

- U1: No gradient hero backgrounds (purple-blue-cyan glows)
- U2: No rounded-16px-shadow-sm card grid with emoji headers
- U7: No copy that says nothing ("seamlessly unlock your team's potential")
- U8: No em-dash overuse
- No bold headline weights — keep `font-light`
- No saturated colors or bright gradients
- No scroll-jacking
- No autoplay video backgrounds

---

## §8 Decision-Making

- Every visual choice must pass: "Does this feel like Suitora?"
- Prefer restraint over decoration
- Prefer progressive disclosure over information density
- Trust signals through specificity, not volume

---

## §9 Workflow

1. Shared motion tokens first (DRY, no visual change)
2. Fix copy inconsistencies
3. Polish a11y and accessibility
4. Enhance CTAs and trust signals
5. Deepen interaction states
6. Upgrade Hero with visual anchor
7. Harden ScrollSection
8. Optional trust bar if real content exists
9. Full responsive + a11y review
