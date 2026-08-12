# Feature Plan: Settings

## 1. Feature Overview

- **Name:** Settings (Profile, Password, Appearance, Preferences, Subscription placeholders)
- **Current Status:** Fully functional
- **Primary Goal:** Give users control over account details, security, theme, and (future) subscription tier while keeping the surface simple.
- **Key Stakeholders:** End-users, support, growth (subscription).

## 2. Current State Assessment (As-Is)

### Strengths
- `/settings` page covering profile, password, appearance, and subscription section.
- Preferences can be persisted server-side (`settings` table).
- Theme (light/dark) integrated with the rest of the app.

### Pain Points & Bugs
- Subscription section is likely placeholder until billing is implemented.
- Password change and email change flows need strong validation and confirmation emails.
- Limited account deletion / data export (GDPR-style) flow.

### Missing Functionality
- Full data export and account deletion (right to be forgotten).
- Notification preferences.
- Billing portal integration (Stripe or similar).

### Dependencies
- Auth, email, profile APIs.
- Theme system.
- Future payment provider.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Account deletion + data export.
- **High:** Robust password and email change with verification.
- **Medium:** Notification preferences.
- **Medium:** Real subscription management when monetization launches.
- **Low:** Density / accessibility preference toggles beyond theme.

### Required Fixes & Adjustments
- Confirm all settings mutations are authenticated and rate-limited.
- Sync theme preference between localStorage and server settings.

### Refactoring & Technical Debt
- Keep settings forms consistent with React Hook Form + Zod patterns used elsewhere.
- Separate “account security” from “preferences” mentally and in UI.

### KPIs for Success
- Successful password-change rate.
- Theme preference retention.
- Support tickets related to “can’t change email / delete account” near zero.

## 4. Actionable Roadmap

### Phase 1 – Trust & Compliance (1–2 weeks)
- [ ] Account deletion flow with confirmation (Medium)
- [ ] Data export (JSON of analyses, favorites, profile) (Medium)
- [ ] Email / password change hardening (Medium)

### Phase 2 – Preferences (1 week)
- [ ] Notification toggles (Small–Medium)
- [ ] Server-synced theme + density (Small)

### Phase 3 – Monetization (when ready)
- [ ] Stripe (or equivalent) customer portal (Large)

### Potential Risks & Mitigation
- **Risk:** Incomplete deletion leaves orphaned images.  
  **Mitigation:** Cascade deletes + storage lifecycle job verification.
