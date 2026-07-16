# Dashboard Feature Flow

## Purpose
This document explains how the main feature experience for Suitora is surfaced on the dashboard page and describes the implementation flow for building or updating dashboard features.

## Design Rule
Before working on the dashboard or any new UI page, read `premium-editorial-ui.md` in the repository root.

- All dashboard design decisions must follow the premium editorial UI rules.
- The dashboard should feel like a seamless continuation of the landing page.
- This applies to layout, typography, spacing, colors, motion, and copy.

## Dashboard Page Location
- Main dashboard page: `app/(dashboard)/dashboard/page.tsx`
- Shared dashboard components: `components/dashboard/`
- Dashboard layout: `app/(dashboard)/layout.tsx`

## Feature Flow Overview
The dashboard page is the central place where users interact with the product after signing in.
It is designed to surface the core features in a calm, editorial interface rather than a data-heavy product dashboard.

Key sections on the dashboard page:

1. Overview header
2. Metrics cards
3. Score trend summary
4. Quick actions
5. Recent analyses

## What the Dashboard Represents
The landing page `Features` section is mainly a product introduction.
On the dashboard page, those same capabilities become actionable user workflows:

- Upload Your Photo -> Quick action: `Upload Photo`
- Add Any Clothing -> Quick action: `Start Analysis`
- AI Analysis -> Dashboard results and recent analyses
- Compatibility Score -> Metric cards and score trend
- Smart Recommendations -> Analysis detail page and saved favorites

## Implementation Flow
### Step 1: Confirm page role
- Dashboard is the authenticated entry point after login.
- It should show the most important actions first and provide reassurance with calm metrics.
- Design must follow `premium-editorial-ui.md` before implementation.

### Step 2: Build the header and page container
- Use `PageContainer` from `components/dashboard`.
- Use `PageHeader` for the top introduction, label, and primary action.
- Keep the copy simple and editorial: calm, purposeful, human.

### Step 3: Implement dashboard metrics
- Render metrics with `MetricCard`:
  - Total Analyses
  - Avg. Score
  - Favorites
  - This Week
- Use gentle motion and subtle borders.
- Keep the layout responsive and easy to scan.

### Step 4: Add score trend summary
- Use `SectionTitle` with a focused subheading.
- Render a score summary inside a softly elevated card.
- Display a sparkline if available.
- Keep supporting text short and benefit-driven.

### Step 5: Add quick action cards
- Use `QuickActionCard` for the most important next steps.
- Actions should map to the core product flows:
  - Upload Photo
  - View History
  - Settings
- Keep the cards consistent with editorial spacing and icon treatment.

### Step 6: Show recent analyses
- Use `SectionTitle` and `AnalysisListItem`.
- If there are no analyses, show `EmptyState` with a calm call to action.
- If there are results, display them in a vertical list with clear scoring and timestamps.

### Step 7: Review and validate
- Check layout on desktop, tablet, and mobile.
- Confirm color contrast, spacing, and typography match the editorial guide.
- Confirm motion is tasteful and not overused.
- Confirm copy communicates the feature flow clearly.

## Notes for Dashboard Feature Work
- New dashboard feature pages should be documented in `docs/`.
- Any new dashboard component should be added to `components/dashboard/` and referenced here.
- If the dashboard experience changes, update this doc with the new flow.

## Recommended files for dashboard feature changes
- `app/(dashboard)/dashboard/page.tsx`
- `components/dashboard/PageContainer.tsx`
- `components/dashboard/PageHeader.tsx`
- `components/dashboard/MetricCard.tsx`
- `components/dashboard/QuickActionCard.tsx`
- `components/dashboard/AnalysisListItem.tsx`
- `components/dashboard/EmptyState.tsx`
- `components/dashboard/Sparkline.tsx`

## Summary
The dashboard page is where Suitora’s product features become practical actions and results. This document defines the feature flow, the main dashboard sections, and the editorial design process needed to implement or update dashboard feature work.
