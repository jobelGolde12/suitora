# Feature Plan: Wardrobe Management

## 1. Feature Overview

- **Name:** Wardrobe Management (Folders, Tags, Outfits)
- **Current Status:** Fully functional
- **Primary Goal:** Turn saved analyses into an organized personal wardrobe that supports outfit building, recommendations, and long-term style tracking.
- **Key Stakeholders:** End-users, product, stylist feature.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated `/wardrobe` page with folders, tags, and outfit suggestions.
- Schema support: `favorites.inWardrobe`, `wardrobeTags`, `wardrobeFolder`, `wardrobeFolders` table, `favoriteOutfits`.
- APIs under `/api/wardrobe/` (items, folders, outfits, favorite outfits).
- Components for folder modal and outfit suggestions.

### Pain Points & Bugs
- Folder hierarchy is currently flat; deep nesting not supported.
- Outfit composition UX may still feel basic.
- Limited visual “wear together” simulation beyond existing try-on of single items.

### Missing Functionality
- Drag-and-drop organization.
- Outfit calendar / “what I wore”.
- Cross-item compatibility scoring inside the wardrobe.
- Import from external closet apps (future).

### Dependencies
- Favorites and analyses data.
- Outfit recommendation engine.
- Stylist context (wardrobe count, folders).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Polish outfit builder (select multiple items → save as outfit).
- **High:** Cross-item compatibility hints inside wardrobe.
- **Medium:** Drag-and-drop or bulk move between folders.
- **Medium:** Visual outfit board with try-on of combined looks (depends on multi-garment try-on maturity).
- **Low:** Seasonal auto-tagging and archive.

### Required Fixes & Adjustments
- Ensure folder delete cascades or reassigns items safely.
- Keep tag taxonomy consistent with item-attributes module.

### Refactoring & Technical Debt
- Treat wardrobe as a projection over favorites + folder metadata rather than a parallel data model.
- Reuse list and card components across history / favorites / wardrobe.

### KPIs for Success
- % of users who add ≥ 5 items to wardrobe within 30 days.
- Outfit creation rate.
- Return visits to wardrobe page.

## 4. Actionable Roadmap

### Phase 1 – Core UX (1–2 weeks)
- [ ] Outfit builder polish and save flow (Medium)
- [ ] Folder CRUD + safe delete (Medium)
- [ ] Empty-state guidance (Small)

### Phase 2 – Intelligence (2 weeks)
- [ ] Cross-item compatibility suggestions (Medium–Large)
- [ ] Bulk organize (Medium)

### Phase 3 – Lifestyle (later)
- [ ] Outfit calendar (Large)
- [ ] Seasonal views (Medium)

### Potential Risks & Mitigation
- **Risk:** Feature complexity overwhelms casual users.  
  **Mitigation:** Progressive disclosure; simple “save to wardrobe” first, advanced organization later.
