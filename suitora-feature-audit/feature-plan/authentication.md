# Feature Plan: Authentication

## 1. Feature Overview

- **Name:** Authentication (Login, Register, Forgot/Reset Password, Sessions)
- **Current Status:** Fully functional
- **Primary Goal:** Securely identify users, protect dashboard and analysis data, and provide a frictionless path from landing to first value (upload & analysis).
- **Key Stakeholders:** End-users, security, product, compliance.

## 2. Current State Assessment (As-Is)

### Strengths
- Better Auth integration with email/password (and session cookies).
- Dedicated routes: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Middleware (`middleware.ts`) protects non-public routes and API endpoints.
- Form validation with React Hook Form + Zod.
- Session tables (`sessions`, `accounts`, `verifications`) in Drizzle schema.
- Rate limiting available on sensitive endpoints.

### Pain Points & Bugs
- Cookie name handling is somewhat defensive (multiple possible Better Auth cookie names).
- Email delivery for verification / password reset depends on `lib/email.ts` configuration; failure modes must be clear to users.
- No social OAuth (Google, Apple) yet — higher friction for some users.
- Limited account recovery beyond email.

### Missing Functionality
- OAuth providers.
- Email verification enforcement before first analysis (optional policy).
- Device / session management UI (view & revoke sessions).
- 2FA / passkeys for higher security tiers.

### Dependencies
- Better Auth configuration and secret.
- Email service (`lib/email.ts`).
- Turso / Drizzle for user & session persistence.
- Middleware and public route list.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Google (and optionally Apple) OAuth.
- **High:** Clear, branded transactional emails with reliable delivery monitoring.
- **Medium:** Session management page under Settings.
- **Medium:** Optional email verification gate before analysis quota.
- **Low:** Passkey / WebAuthn support.

### Required Fixes & Adjustments
- Harden cookie detection and document exact cookie names used in production.
- Ensure password reset tokens expire correctly and cannot be reused.
- Improve error messages for “email already registered”, invalid token, rate-limited login.

### Refactoring & Technical Debt
- Centralize auth client helpers (`lib/auth/client.ts`, `lib/auth/actions.ts`).
- Keep server actions and route handlers consistent with project API response shape.
- Add automated tests around critical auth flows (already some coverage in `actions.test.ts`).

### KPIs for Success
- Registration completion rate > 70% of started sign-ups.
- Login success rate > 98% for valid credentials.
- Password-reset success rate > 90% of initiated requests.
- Zero critical auth-related security findings in periodic review.

## 4. Actionable Roadmap

### Phase 1 – Reliability & UX (1 week)
- [ ] Audit and document production cookie names + middleware (Small)
- [ ] Improve form error and loading states (Small)
- [ ] End-to-end test of forgot/reset password with real email provider (Medium)

### Phase 2 – OAuth (1–2 weeks)
- [ ] Add Google OAuth via Better Auth (Medium)
- [ ] Update register/login UI with “Continue with Google” (Small)
- [ ] Handle account linking edge cases (Medium)

### Phase 3 – Advanced Security (later)
- [ ] Session list & revoke UI (Medium)
- [ ] Optional 2FA / passkeys (Large)

### Potential Risks & Mitigation
- **Risk:** Email provider outage blocks password resets.  
  **Mitigation:** Fallback provider, clear user messaging, support contact path.
- **Risk:** OAuth account collision with existing email/password users.  
  **Mitigation:** Explicit linking flow and security review of Better Auth config.
