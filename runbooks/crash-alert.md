# Runbook: Crash Alert Triage

| Field        | Value                                            |
|--------------|--------------------------------------------------|
| Incident type | Service crash / crash-loop / OOM               |
| Severity     | critical (users affected) → warning             |
| Owner        | On-call engineering + Platform                   |
| Review cadence | Quarterly, and after every postmortem            |

## Purpose

How to acknowledge and triage crash alerts, access logs and metrics, debug
common crash scenarios, escalate when needed, and communicate status to
stakeholders.

## Recovery Objectives

| Metric | Target                                        |
|--------|-----------------------------------------------|
| RTO    | Acknowledge ≤ 5 min; mitigate ≤ 30 min for critical |
| RPO    | n/a                                            |

## Alert Sources

- Pager/Alertmanager receiver `oncall-critical` for critical rules.
- Grafana alert rules: `SuitoraNoData`, `SuitoraHighErrorRate`,
  `SuitoraNodeHeapExhaustion`, `SuitoraInFlightRequests`, etc. (see
  `docs/runbooks.md`).

## Step 1 — Acknowledge

- Acknowledge the alert **within 5 minutes** for critical severity.
- If you cannot act, acknowledge and escalate to the on-call secondary
  immediately (see Escalation).
- Announce you are on the incident in the team's on-call channel.

## Step 2 — Triage

1. **What is down?** Check container/service status:

   ```bash
   # Docker Compose
   docker compose ps
   # Kubernetes
   kubectl get pods -n <env>
   ```

2. **Recent crash/restart count** — determine if this is a single crash or a
   crash-loop (rapid consecutive restarts).

3. **Access logs** (structured, correlated by `requestId`/`trace_id`):

   ```bash
   journalctl -u suitora | tail -n 200
   kubectl logs deploy/suitora-web -n <env> --tail=200 --previous
   ```

   Start from the newest entries and work backwards to the first sign of
   trouble; correlate with Grafana for latency/error spikes at the same time.

4. **Check resource usage** — OOM is the most common crash cause:

   ```bash
   free -h; df -h; docker stats --no-stream
   ```

## Step 3 — Common Crash Scenarios & Fixes

| Symptom | Likely cause | Fix / runbook |
|---------|--------------|----------------|
| OOM kill (container `137` / `Killed`) | Heap/CPU exhaustion | Increase `NODE_OPTIONS=--max-old-space-size`; if repeat, scale replicas. See `service-restart.md`. |
| Unhandled exception / crash-loop | Uncaught error in request handler or job | Read the last stack trace, fix at `error_code`, redeploy; apply `service-restart.md`. |
| Dependency failure (DB/Redis/provider) | Downstream service unavailable | Check DB reachability (`/api/health`), Upstash status, provider dashboard. Fix dependency, then restart the tier. |
| `SuitoraNoData` (metrics down) | Monitoring scrape failure, not necessarily app down | Check `/metrics` endpoint and the LB; restart web tier (`service-restart.md`). |
| Job/worker crash | Bug in worker job (e.g. trend-sync) | Reproduce in `npm run worker`, fix and redeploy. |

## Step 4 — Mitigate

- If it is a **deployment** regression, roll back to the last known-good
  version (see `runbooks/service-restart.md` → Rollback, and
  `scripts/rollback.sh`).
- Otherwise apply the scenario fix above and restart the affected tier.
- Verify: `/api/health` 200, metrics normal, error rate falling.

## Escalation Path

1. Primary on-call — acknowledge within 5 min.
2. No ack in 5 min → on-call secondary.
3. No ack/not resolved in 15 min → engineering lead.
4. Data-loss or security incident → also page the Platform/security lead and
   follow `SECURITY.md`.

Configure the alert routes in `docker/alertmanager/alertmanager.yml`.

## Communication Template

Use for status pages / stakeholder updates:

```text
Status: INVESTIGATING | MITIGATED | RESOLVED
Impact: <who is affected, what they experience>
Root cause: <if known>
Action: <what was done / is being done>
Next update: <time>
```

## Post-Incident Review (Postmortem)

For any crash with user impact, schedule a postmortem within 3 business days:

- **What happened** (timeline) and **impact**.
- **Root cause** and **contributing factors**.
- **Detection**: how/when the alert fired, time to acknowledge.
- **Actions**: documented fixes (all must have an owner and a due date).
- **Prevention**: tests, alerts, or runbook updates to prevent recurrence.

Update this runbook if the incident revealed a gap in these procedures.

## Verification / Completion

- [ ] Crash resolved, service healthy for a sustained period
- [ ] Alerts clear and no crash-loop
- [ ] Root cause documented
- [ ] Postmortem scheduled if user impact occurred

## Ownership

This runbook is owned by the on-call engineering team. Any change to
monitoring, deployment, or runbook tooling must keep this document in sync.
