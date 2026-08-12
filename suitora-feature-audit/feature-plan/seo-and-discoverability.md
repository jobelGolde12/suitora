# Feature Plan: SEO & Discoverability

## 1. Feature Overview

- **Name:** SEO, Sitemap & Robots
- **Current Status:** Fully functional
- **Primary Goal:** Ensure Suitora is discoverable by search engines for relevant fashion and virtual try-on queries, and that public pages are correctly indexed while private dashboard content is not.
- **Key Stakeholders:** Growth, marketing, engineering.

## 2. Current State Assessment (As-Is)

### Strengths
- `app/sitemap.ts` and `app/robots.ts`.
- Metadata in root layout.
- Public landing and legal pages.

### Pain Points & Bugs
- Limited structured data (JSON-LD) for organization / software application.
- Few content pages beyond the landing (blog / guides would help long-tail SEO).
- Social sharing cards (Open Graph / Twitter) may need richer images and copy.

### Missing Functionality
- Blog or educational content hub.
- Per-page Open Graph images.
- International targeting if multi-language is added.

### Dependencies
- Public routes only.
- Brand assets.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Complete Open Graph / Twitter card coverage for landing and key public pages.
- **Medium:** JSON-LD for SoftwareApplication / Organization.
- **Medium:** Lightweight content/guides section targeting “does this suit me”, “virtual try-on”, etc.
- **Low:** hreflang when localization ships.

### Required Fixes & Adjustments
- Confirm robots.txt correctly disallows `/dashboard`, `/api`, etc.
- Validate sitemap only includes canonical public URLs.

### Refactoring & Technical Debt
- Centralize metadata helpers to avoid duplication.

### KPIs for Success
- Organic traffic growth.
- Index coverage of intended public pages.
- Rich result eligibility where applicable.

## 4. Actionable Roadmap

### Phase 1 – Fundamentals (3–5 days)
- [ ] OG / Twitter audit and fixes (Small)
- [ ] robots / sitemap verification (Small)
- [ ] JSON-LD (Small)

### Phase 2 – Content (ongoing)
- [ ] 3–5 educational articles or guides (Medium each)

### Phase 3 – International (later)
- [ ] hreflang and localized landing (Large)

### Potential Risks & Mitigation
- **Risk:** Accidental indexing of private pages.  
  **Mitigation:** Explicit disallow rules + noindex on authenticated layouts.
