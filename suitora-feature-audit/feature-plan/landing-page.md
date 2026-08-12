# Feature Plan: Landing Page

## 1. Feature Overview

- **Name:** Landing Page (Hero, Features, How It Works, FAQ, CTA)
- **Current Status:** Fully functional
- **Primary Goal:** Convert visitors into registered users by clearly communicating Suitora’s value proposition (“Know if it suits you before you buy”) and guiding them into the auth flow.
- **Key Stakeholders:** Prospective users, marketing, product owner, SEO.

## 2. Current State Assessment (As-Is)

### Strengths
- Clean, modern Next.js App Router page under `app/(landing)/`.
- Sections cover Hero, Features, How It Works, FAQ.
- Responsive layout with Tailwind v4 and Framer Motion micro-interactions.
- Dark/light mode support via existing theme system.
- Strong branding assets (`public/suitora_logo.png`, icons).

### Pain Points & Bugs
- Content and visuals may still lean on placeholder or early-design copy (see `docs/landing_ui_enhancement_plan.md` and `docs/welcome_page_design_plan.md`).
- Limited social proof (testimonials, metrics, press logos).
- CTA paths could be clearer for both “Try free” and “See demo”.
- No A/B testing instrumentation yet.

### Missing Functionality
- Interactive mini-demo or animated “before/after” try-on preview without requiring signup.
- Trust signals (privacy badges, “no credit card required”).
- Localized content for target markets (SEA e-commerce focus).

### Dependencies
- Theme / design tokens.
- Auth routes for CTA targets.
- SEO metadata (`app/layout.tsx`, `sitemap.ts`).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Hero with short looping or interactive try-on teaser (static images or lightweight video).
- **High:** Social proof strip (user count, average score improvement, retailer logos).
- **Medium:** FAQ expansion covering data privacy, accuracy expectations, supported retailers.
- **Medium:** Sticky mobile CTA bar.
- **Low:** Multi-language hero toggle (EN / ID / PH first).

### Required Fixes & Adjustments
- Align copy and visual hierarchy with `docs/landing_ui_enhancement_plan.md`.
- Ensure all CTAs route correctly to `/register` or `/login` with return URL support.
- Audit Lighthouse performance and accessibility scores.

### Refactoring & Technical Debt
- Extract section components into `components/landing/` for easier A/B variants.
- Move marketing copy to a structured content module (or CMS later).
- Ensure images use `next/image` with proper sizes and priority flags.

### KPIs for Success
- Increase landing → register conversion by 20%.
- Reduce bounce rate by 15%.
- Lighthouse Performance ≥ 90, Accessibility ≥ 95.
- Time-to-interactive under 2.5 s on mid-tier mobile.

## 4. Actionable Roadmap

### Phase 1 – Content & Conversion Polish (1–2 weeks)
- [ ] Rewrite hero value prop and primary CTA (Small)
- [ ] Add social-proof strip and trust badges (Medium)
- [ ] Expand FAQ with privacy & accuracy answers (Small)
- [ ] Instrument basic conversion events (analytics) (Small)

### Phase 2 – Visual & Interactive (2–3 weeks)
- [ ] Design and implement try-on teaser media (Medium–Large)
- [ ] Mobile sticky CTA (Small)
- [ ] Performance pass (image priority, font loading) (Medium)

### Phase 3 – Experimentation (ongoing)
- [ ] A/B test hero variants (Medium)
- [ ] Optional localization foundation (Large)

### Potential Risks & Mitigation
- **Risk:** Heavy media hurts Core Web Vitals.  
  **Mitigation:** Use optimized WebP/AVIF, lazy-load below fold, provide static fallback.
- **Risk:** Over-promising AI accuracy.  
  **Mitigation:** Clear disclaimers in FAQ and results pages; set realistic expectations in copy.
