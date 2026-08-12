# Feature Plan: Background Jobs

## 1. Feature Overview

- **Name:** Background Jobs (Trend Sync, Retention / Cleanup)
- **Current Status:** Fully functional
- **Primary Goal:** Keep trend data fresh and storage costs under control without blocking user-facing requests.
- **Key Stakeholders:** Engineering, cost owners, reliability.

## 2. Current State Assessment (As-Is)

### Strengths
- `jobs/trend-sync.ts` and `jobs/retention.ts`.
- Trend sync logs table for observability.
- Upload cleanup API and retention utilities.
- Can be invoked via cron, CLI, or protected admin API.

### Pain Points & Bugs
- Scheduling depends on external cron / Vercel cron / worker; needs reliable production configuration.
- Limited alerting on job failure.
- Retention rules must stay aligned with privacy policy.

### Missing Functionality
- Central job dashboard or status page for operators.
- Dead-letter / retry policy visibility.
- Cost reports per job type.

### Dependencies
- Trend providers, storage, database.
- Secrets and network access for jobs runtime.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Production cron configuration with failure alerts.
- **Medium:** Operator-visible last-run status and metrics.
- **Medium:** Tunable retention windows by data class (uploads vs analyses metadata).
- **Low:** Additional jobs (e.g., product metadata refresh, cache warm).

### Required Fixes & Adjustments
- Ensure jobs are idempotent.
- Protect any HTTP trigger endpoints with secrets or admin auth.

### Refactoring & Technical Debt
- Keep job entrypoints thin; business logic in `lib/`.
- Structured logging for easy ingestion into monitoring.

### KPIs for Success
- Trend sync success rate ≥ 95%.
- Storage growth rate within budget.
- Mean time to detect job failure < 1 hour.

## 4. Actionable Roadmap

### Phase 1 – Reliability (1 week)
- [ ] Production schedule + alerts (Medium)
- [ ] Idempotency and secret protection audit (Small)

### Phase 2 – Observability (1 week)
- [ ] Last-run status endpoint or dashboard (Medium)
- [ ] Retention metrics (Small)

### Phase 3 – Expansion (later)
- [ ] Additional maintenance jobs as needed (varies)

### Potential Risks & Mitigation
- **Risk:** Runaway deletion in retention.  
  **Mitigation:** Dry-run mode, soft-delete windows, backups before aggressive purge.
