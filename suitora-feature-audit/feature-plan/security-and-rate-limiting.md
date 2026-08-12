# Feature Plan: Security & Rate Limiting

## 1. Feature Overview

- **Name:** Rate Limiting, Security & Middleware
- **Current Status:** Fully functional
- **Primary Goal:** Protect the application and its users from abuse, unauthorized access, and common web vulnerabilities while preserving a smooth legitimate experience.
- **Key Stakeholders:** Security, engineering, compliance, all users.

## 2. Current State Assessment (As-Is)

### Strengths
- Middleware enforces authentication on protected routes and APIs.
- Rate limiting utility (`lib/rate-limit.ts`) applied to analysis and upload endpoints.
- Input validation with Zod on forms and many API bodies.
- Secrets kept in environment variables; `.env` files are not committed.
- Better Auth session handling.

### Pain Points & Bugs
- Rate-limit storage (in-memory vs durable) may not be ideal for multi-instance deployments.
- Webhook endpoints (try-on) need explicit signature verification.
- CSP and other security headers may still be incomplete.

### Missing Functionality
- Durable, distributed rate limiting (e.g., Redis / Upstash).
- Security headers (CSP, HSTS, etc.) via Next.js config or middleware.
- Automated dependency vulnerability scanning in CI (partially present via workflow).
- Abuse reporting path.

### Dependencies
- Middleware, auth, env configuration.
- CI workflow (`.github/workflows/ci.yml`).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Distributed rate limiting for production scale.
- **High:** Signed webhooks and strict CORS where applicable.
- **Medium:** Comprehensive security headers.
- **Medium:** Regular dependency and secret scanning.
- **Low:** User-facing abuse / report controls on public-ish content.

### Required Fixes & Adjustments
- Audit all public API routes for auth and rate limits.
- Ensure error responses do not leak stack traces or internal IDs in production.

### Refactoring & Technical Debt
- Centralize rate-limit key design (per user, per IP, per endpoint).
- Document threat model briefly for future contributors.

### KPIs for Success
- Zero critical vulnerabilities open > 30 days.
- Rate-limit false-positive rate low enough that legitimate power users are not blocked.
- No confirmed session fixation or auth bypass issues.

## 4. Actionable Roadmap

### Phase 1 – Hardening (1 week)
- [ ] Webhook signature verification (Small–Medium)
- [ ] Security headers (Small)
- [ ] Production error sanitization audit (Small)

### Phase 2 – Scale (1–2 weeks)
- [ ] Distributed rate limiter (Medium)
- [ ] CI secret + dependency scanning (Small)

### Phase 3 – Ongoing
- [ ] Periodic threat-model review (ongoing)

### Potential Risks & Mitigation
- **Risk:** Overly strict rate limits block real users.  
  **Mitigation:** Tiered limits, clear retry-after headers, support override path.
