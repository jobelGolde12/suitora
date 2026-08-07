# Feature Plan: User Profile & Self-Image Management

## 1. Feature Overview

- **Name:** User Profile & Self-Image Management
- **Current Status:** Fully functional (with estimation hooks)
- **Primary Goal:** Maintain an accurate, privacy-respecting representation of the user (photo + body attributes) that powers all downstream analysis, try-on, and stylist features.
- **Key Stakeholders:** End-users, AI pipeline, privacy/compliance.

## 2. Current State Assessment (As-Is)

### Strengths
- `users.selfImageUrl` and `user_profiles` table.
- Self-image modal and APIs (`/api/user/self-image`, `/api/user/profile`, estimate route).
- Body estimation and size-prediction modules feed profile data.
- Settings page allows profile updates.

### Pain Points & Bugs
- Users may upload non-ideal photos (poor lighting, extreme angles).
- Height/weight estimation confidence is not always surfaced clearly.
- Profile completeness is not strongly guided for new users.

### Missing Functionality
- Guided onboarding for first self-image + basic attributes.
- Multiple self-images (e.g., different seasons or formal vs casual).
- Explicit consent and retention messaging for biometric-adjacent data.

### Dependencies
- Upload & storage.
- Body estimation / size prediction.
- Auth and settings.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** First-run guided self-image capture with quality tips.
- **High:** Surface confidence of estimated attributes and allow manual override.
- **Medium:** Multiple self-images with primary selection.
- **Medium:** Clear privacy explainer for how images and body data are used.
- **Low:** Optional body-measurement inputs for higher accuracy.

### Required Fixes & Adjustments
- Ensure self-image updates invalidate related caches and pending analyses expectations.
- Validate ownership on all profile mutation endpoints.

### Refactoring & Technical Debt
- Keep profile read model consistent for stylist, analysis, and dashboard.
- Version estimated attributes so historical analyses remain interpretable.

### KPIs for Success
- % of registered users with a valid self-image within 24 h.
- Manual override rate of estimated attributes (signal of trust issues).
- Reduction in analysis failures caused by missing self-image.

## 4. Actionable Roadmap

### Phase 1 – Onboarding (1 week)
- [ ] Guided first self-image flow (Medium)
- [ ] Confidence + override UI (Medium)

### Phase 2 – Depth (1–2 weeks)
- [ ] Multiple self-images (Medium–Large)
- [ ] Privacy explainer content (Small)

### Phase 3 – Accuracy (later)
- [ ] Optional manual measurements (Medium)

### Potential Risks & Mitigation
- **Risk:** Sensitivity around body data.  
  **Mitigation:** Transparent copy, easy deletion, minimal retention, no sale of data.
