# Feature Plan: Outfit Comparison

## 1. Feature Overview

- **Name:** Outfit / Analysis Comparison
- **Current Status:** Fully functional
- **Primary Goal:** Help users decide between multiple candidate items by comparing scores, attributes, and try-on visuals side-by-side.
- **Key Stakeholders:** End-users, product.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated `/compare` page.
- Users select up to a fixed maximum (currently 4) analyses.
- `ComparisonView` component presents differences.
- Pulls from existing analysis history.

### Pain Points & Bugs
- Selection UX can be improved (search within selectable list).
- Try-on images may be missing, reducing visual comparison value.
- Limited quantitative “winner” suggestion.

### Missing Functionality
- Weighted comparison (user prioritizes color vs fit vs style).
- Save comparison sets for later.
- Share comparison results.

### Dependencies
- Analysis history and results data.
- Design components under `components/compare/`.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Better selection UI with search and filters.
- **Medium:** Highlight recommended “best overall” based on user preferences.
- **Medium:** Include try-on images when available.
- **Low:** Save and share comparison sessions.

### Required Fixes & Adjustments
- Enforce selection limit clearly in UI.
- Handle missing scores or metadata gracefully.

### Refactoring & Technical Debt
- Keep comparison pure (no new DB writes unless saving sessions).
- Reuse score and attribute display components from Results.

### KPIs for Success
- % of multi-analysis users who use Compare.
- Conversion from comparison to favorite / wardrobe add.

## 4. Actionable Roadmap

### Phase 1 – UX (1 week)
- [ ] Searchable multi-select list (Medium)
- [ ] Clear max-selection messaging (Small)
- [ ] Missing-data placeholders (Small)

### Phase 2 – Intelligence (1 week)
- [ ] Weighted / preference-aware ranking (Medium)
- [ ] Try-on column when data exists (Small)

### Phase 3 – Persistence (later)
- [ ] Save comparison sets (Medium)

### Potential Risks & Mitigation
- **Risk:** Too many columns on mobile.  
  **Mitigation:** Horizontal scroll or stacked cards with swipe.
