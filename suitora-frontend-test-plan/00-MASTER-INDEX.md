# Suitora Front-End Test Plan — Master Index

**Project:** Suitora — AI Fashion Compatibility Platform  
**Repository:** https://github.com/jobelGolde12/suitora.git  
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, React Hook Form + Zod, Better Auth, Lucide Icons  
**Test Plan Version:** 1.0  
**Date:** August 2026  

---

## Purpose

This folder contains a complete **front-end test plan** for Suitora. It covers every route, major feature, shared UI component, responsive behavior, accessibility, error/edge cases, and cross-cutting concerns.

Use these documents for:

- Manual exploratory and regression testing
- Writing automated E2E tests (Playwright / Cypress)
- Writing component tests (Vitest + Testing Library)
- QA sign-off before releases
- Onboarding new QA / frontend engineers

---

## How to Use This Suite

1. Start with this **Master Index** for the full map.
2. Open the relevant page/feature file for detailed test cases.
3. Each test case follows a consistent format:
   - **ID** — unique identifier
   - **Priority** — P0 (blocker) / P1 (critical) / P2 (important) / P3 (nice-to-have)
   - **Type** — Functional / UI / UX / Validation / Responsive / A11y / Error / Performance
   - **Preconditions**
   - **Steps**
   - **Expected Result**
4. Cross-cutting concerns (responsive, a11y, navigation, loading/error states) have dedicated files and are also referenced from page-level plans.

---

## Application Route Map

| Route | Page / Feature | Auth Required | Test Plan File |
|-------|----------------|---------------|----------------|
| `/` | Landing page | No | `01-landing-page.md` |
| `/login` | Login | No (guest) | `02-authentication.md` |
| `/register` | Register | No (guest) | `02-authentication.md` |
| `/forgot-password` | Forgot password | No | `02-authentication.md` |
| `/reset-password` | Reset password | No (token) | `02-authentication.md` |
| `/dashboard` | Dashboard home | Yes | `03-dashboard.md` |
| `/upload` | Try It On (upload flow) | Yes | `04-upload-try-it-on.md` |
| `/analysis` | Analysis progress / intermediate | Yes | `04-upload-try-it-on.md` |
| `/results/[id]` | Analysis results detail | Yes | `05-analysis-results.md` |
| `/history` | Analysis history | Yes | `06-history.md` |
| `/favorites` | Favorites | Yes | `07-favorites.md` |
| `/wardrobe` | Wardrobe & folders | Yes | `08-wardrobe.md` |
| `/compare` | Outfit comparison | Yes | `09-compare.md` |
| `/trending` | Trending items list | Yes | `10-trending.md` |
| `/trending/[id]` | Trending item detail | Yes | `10-trending.md` |
| `/stylist` | AI Stylist chat | Yes | `11-ai-stylist.md` |
| `/settings` | User settings & profile | Yes | `12-settings.md` |
| `/privacy-policy` | Privacy policy | No | `13-legal-and-privacy.md` |
| `*` (404) | Not found | — | `14-global-layout-and-errors.md` |
| Error boundary | App error | — | `14-global-layout-and-errors.md` |

---

## File Inventory

| File | Coverage |
|------|----------|
| `00-MASTER-INDEX.md` | This index, conventions, priority definitions |
| `01-landing-page.md` | Hero, TrustBar, Features, How It Works, FAQ, CTA, Navbar/Footer |
| `02-authentication.md` | Login, Register, Forgot/Reset password, Google OAuth, session, redirects |
| `03-dashboard.md` | Metrics, score trend, quick actions, recent analyses, empty states |
| `04-upload-try-it-on.md` | Self-image, clothing upload/URL, validation, analysis trigger |
| `05-analysis-results.md` | Scores, fit analytics, color palette, size recs, try-on, actions |
| `06-history.md` | List, search, sort, delete, pagination/empty |
| `07-favorites.md` | Favorite toggle, list, unfavorite |
| `08-wardrobe.md` | Items, folders, outfits, suggestions |
| `09-compare.md` | Multi-item comparison UI |
| `10-trending.md` | Grid, filters, carousel, detail, similar items |
| `11-ai-stylist.md` | Chat UI, chips, responses, history |
| `12-settings.md` | Profile form, password, appearance, preferences, self-image |
| `13-legal-and-privacy.md` | Privacy policy rendering |
| `14-global-layout-and-errors.md` | Shell, sidebar, mobile nav, 404, error, loading |
| `15-shared-ui-components.md` | Button, Input, Modal, Toast, ScoreCircle, Skeletons, etc. |
| `16-responsive-and-cross-browser.md` | Breakpoints, mobile nav, touch, browsers |
| `17-accessibility.md` | Keyboard, ARIA, focus, contrast, screen readers |
| `18-loading-error-edge-cases.md` | Network failures, empty states, rate limits, invalid IDs |
| `19-performance-and-ux.md` | Perceived performance, animations, prefetch, skeletons |

---

## Priority Definitions

| Priority | Meaning | Release Gate |
|----------|---------|--------------|
| **P0** | Blocks core user journey (auth, upload → results) | Must pass |
| **P1** | Critical feature correctness or major UX defect | Must pass |
| **P2** | Important secondary features / polish | Should pass |
| **P3** | Nice-to-have, edge polish, future hardening | Nice to pass |

---

## Test Environment Recommendations

- **Browsers:** Chrome (latest), Safari (latest), Firefox (latest), Edge (latest)
- **Devices / Viewports:**
  - Mobile: 375×667, 390×844
  - Tablet: 768×1024
  - Desktop: 1280×800, 1440×900, 1920×1080
- **Auth states:** Logged out, logged in (fresh user), logged in (with history/favorites/wardrobe data)
- **Network:** Online, slow 3G, offline (for error handling)
- **Feature flags / mocks:** Mock AI analysis path vs real provider (when available)

---

## Suggested Test Data

- Valid user credentials (test account)
- Valid self-image (portrait photo, JPEG/PNG under size limit)
- Invalid files (too large, wrong MIME, non-image)
- Product image (clothing on white/simple background)
- Product URLs (supported marketplaces + unsupported)
- Empty vs populated history / favorites / wardrobe

---

## Conventions Used in Test Cases

- **UI element names** match visible labels or component names from the codebase where practical.
- Routes use App Router paths (`/dashboard`, `/results/[id]`, etc.).
- “Shell” refers to `DashboardShell` (sidebar + mobile nav + top bar).
- Self-image = user’s saved body/photo used for try-on and analysis.

---

## Related Existing Project Docs

- Feature inventory: previous `suitora-feature-audit`
- Responsive inventory: previous `suitora-responsive-plan`
- README, `docs/project_detail.md`, `docs/dashboard_feature_flow.md`

---

## Change Log

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | Aug 2026 | Initial comprehensive front-end test plan suite |
