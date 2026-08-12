# Feature Plan: Legal & Privacy

## 1. Feature Overview

- **Name:** Privacy Policy & Legal Pages
- **Current Status:** Fully functional
- **Primary Goal:** Provide transparent, accessible legal information and support compliance with privacy expectations (and future regulations) while building user trust.
- **Key Stakeholders:** End-users, legal, compliance, product.

## 2. Current State Assessment (As-Is)

### Strengths
- Privacy policy content under `privacy_policy/` and rendered at `/privacy-policy`.
- Legal layout and content helpers (`lib/legal/`).
- Public route exempted from auth middleware.

### Pain Points & Bugs
- Policy may need periodic legal review as AI, image storage, and body-estimation features evolve.
- Terms of Service may be incomplete or missing as a first-class page.
- Cookie / tracking disclosure may need expansion if analytics are added.

### Missing Functionality
- In-app consent management for optional analytics or marketing emails.
- Versioned policy history and “last updated” prominence.
- Data Processing / subprocessors list.

### Dependencies
- Content source of truth and legal counsel.
- Settings (account deletion, export) for operationalizing rights.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Keep privacy policy synchronized with actual data practices (images, body estimates, AI providers).
- **High:** Account deletion and export as operational counterparts (see Settings plan).
- **Medium:** Terms of Service page.
- **Medium:** Cookie banner / preference center if non-essential cookies are introduced.
- **Low:** Public subprocessors page.

### Required Fixes & Adjustments
- Ensure links from footer, register, and settings always point to current policy.
- Review AI provider data-sharing language.

### Refactoring & Technical Debt
- Prefer Markdown or structured content rendered by the app so updates do not require code deploys for every wording change (optional).

### KPIs for Success
- Policy accessibility (findable in ≤ 2 clicks from any page).
- Zero material mismatches between stated policy and actual behavior.

## 4. Actionable Roadmap

### Phase 1 – Accuracy (ongoing)
- [ ] Legal review of privacy policy against current features (Medium)
- [ ] Terms of Service draft and page (Medium)

### Phase 2 – Operational Rights (aligned with Settings)
- [ ] Deletion + export fully working (see Settings plan)

### Phase 3 – Transparency (later)
- [ ] Subprocessors list (Small)
- [ ] Cookie preferences if needed (Medium)

### Potential Risks & Mitigation
- **Risk:** Policy lag behind product changes.  
  **Mitigation:** Checklist item in release process for privacy-impacting features.
