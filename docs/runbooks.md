# Suitora Runbook

On-call procedures for incidents surfaced by the observability stack
(Pillar 04: `production-plan/04_observability_logging.md`).

## Severity & SLA

| Severity | Meaning | Resolution SLA |
|----------|---------|----------------|
| critical | Users are affected (errors, app down) | Acknowledge ≤ 5 min, mitigate ≤ 30 min |
| warning  | Degradation, no user impact yet | Next business day |

## Where to look

1. **Grafana** (port 3001): `Suitora Overview` dashboard — latency, errors,
   traffic, saturation, try-on events.
2. **Logs**: structured JSON, one line per event, all correlated by
   `requestId`/`correlationId` and `trace_id`/`span_id`. Grep by request ID to
   replay a single request's full path across web + worker.
3. **Alertmanager** (port 9093): alert history and active alerts.

## Correlation

Every HTTP response carries `X-Request-Id`. Use it to pull all log lines for a
request:

```sh
journalctl -u suitora | rg "<request-id>"
```

The same ID is propagated to outbound provider calls (OpenAI/RunPod/Cloudinary)
for end-to-end correlation.

## Alert runbooks

### SuitoraHighErrorRate (critical)
Error ratio on a route > 5% for 5 minutes.
- Check Grafana "Error rate by code / route" — identify `error_code` (e.g.
  `UPSTREAM_UNAVAILABLE`, `RATE_LIMIT`).
- Pull recent error logs for the affected route; look for `errorCode` and
  stack trace (server-side only).
- If `UPSTREAM_UNAVAILABLE`/`RATE_LIMIT`: check the provider dashboard and the
  trend-sync worker logs.
- Mitigation: disable the failing provider via env, or roll back the last
  deploy.

### SuitoraNoData (critical)
Prometheus cannot scrape `web:3000/metrics`.
- Check `docker compose ps web`; restart if exited (`docker compose up -d web`).
- Check host memory/disk. OOM-killed containers restart via `restart: always`.
- If the LB is healthy but /metrics is dead, restart the web tier.

### SuitoraHighLatency (warning)
p99 > 2s on a route for 5 minutes.
- Check Grafana latency panel for the offending route.
- Look for slow `db_query_duration_seconds` (index/query tuning) or upstream
  provider latency (upstream_request_duration_seconds).
- Scale web replicas if CPU/heap is saturating.

### SuitoraProviderFailure (warning)
> 10% of try-on events failed in 5m.
- Check provider status (RunPod/OpenAI).
- Check `tryon.failed` / `tryon.submit_failed` audit-log rows and the
  provider error in logs.
- Failures auto-fallback to the mock provider; verify users see the degraded
  experience, then restore the provider.

### SuitoraNodeHeapExhaustion / SuitoraInFlightRequests / SuitoraSlowDatabase (warning)
- Heap: restart web tier; increase `NODE_OPTIONS=--max-old-space-size` if repeat.
- In-flight: check for a runaway loop in trend-sync or a traffic spike.
- Slow DB: review slow queries; see `03_database_data_integrity.md`.

## Synthetic health check

A cron job hits `/api/health` every minute and exits non-zero on failure (the
`SuitoraNoData` Prometheus rule covers scrape-down, this covers end-user path):

```cron
* * * * * cd /srv/suitora && /usr/bin/npx tsx jobs/health-check.ts >> /var/log/suitora/health-check.log 2>&1
```

Set `HEALTH_CHECK_URL` if the probe must go through the public LB.

## Escalation

1. Primary on-call (paged for critical via Alertmanager receiver
   `oncall-critical`). Acknowledge within 5 minutes.
2. No ack in 5 minutes → escalation to the on-call secondary (configure the
   `routes` in `docker/alertmanager/alertmanager.yml`).
3. No ack in 15 minutes → page the engineering lead.
