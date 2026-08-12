# Runbook: Database Backup & Restore

| Field        | Value                                             |
|--------------|---------------------------------------------------|
| Incident type | Data loss / database corruption / restore        |
| Severity     | critical (data), warning (missed backup)          |
| Owner        | Platform / Data engineering team                  |
| Review cadence | Quarterly (and after any restore drill)           |

## Purpose

How to trigger, verify, and restore Suitora's database backups, and the
recovery objectives we commit to.

## Recovery Objectives (RTO / RPO)

| Metric                | Target            | Notes                                             |
|-----------------------|-------------------|---------------------------------------------------|
| **RPO**               | ≤ 24 hours        | Daily automated dump (default retention 30 days)  |
| **RTO** (restore)     | ≤ 1 hour          | From a verified dump to serving traffic           |
| Backup retention      | 30 dailies + 12   | `BACKUP_RETAIN_DAILY=30`, `BACKUP_RETAIN_MONTHLY=12` |

> **RPO caveat:** with a daily backup, up to 24 hours of changes can be lost on
> a restore. If you need tighter RPO, reduce the schedule or add point-in-time
> replication. This is a known limitation (see
> `docs/03_database_data_integrity.md`).

## Prerequisites / Access

- AWS/S3 credentials for the backup bucket (`S3_ENDPOINT`, `S3_REGION`,
  `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`).
- Database credentials (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) — for remote
  DBs, read access is sufficient for a dump.
- Access to run the project scripts (npm + `tsx`).

## How Backups Work

- **Automated:** a daily job runs `npm run backup` (`jobs/backup.ts`), which
  dumps the database to a portable SQL file, gzips it, and uploads to
  `db/backups/suitora-<ISO timestamp>.sql.gz` in S3. It then prunes old dumps
  per the retention policy and records a `backup_logs` status row.
- **Triggered by:** the scheduled job and the `POST /api/backup` endpoint
  (CRON_SECRET-protected).

## Manual Backup

1. Set the required storage/database env vars (see **Prerequisites**).
2. Trigger a one-off backup:

   ```bash
   npm run backup
   ```

3. Confirm the upload:

   ```bash
   aws s3 ls s3://$S3_BUCKET/db/backups/ --recursive | tail
   ```

4. Verify the newest dump exists for today's timestamp and the `backup_logs`
   row shows `status = 'completed'` (or success in the job logs).

## Verify Backup Integrity

Restore the dump into a throwaway database and assert it loads cleanly:

```bash
# 1. Download the newest dump
aws s3 cp s3://$S3_BUCKET/db/backups/suitora-<timestamp>.sql.gz /tmp/verify.sql.gz
gunzip -k /tmp/verify.sql.gz -f

# 2. Apply it to a scratch file DB
turso db shell < /tmp/verify.sql  \
  # or: sqlite3 /tmp/verify.db < /tmp/verify.sql  (for the local file path)
```

1. Spot-check row counts for critical tables (e.g. `users`, `analyses`):

   ```bash
   sqlite3 /tmp/verify.db "SELECT count(*) FROM users; SELECT count(*) FROM analyses;"
   ```

2. Expect no SQL errors and expected counts. A dump that errors on restore is
   **not** valid — treat it as a failed backup and re-run.

## Restore Procedure

> Restore is destructive. Take a working snapshot of the current DB first, and
> restore into a staging DB to validate before touching production.

1. **Download the target dump** (pick the newest valid one, or the timestamp
   that matches your RPO window):

   ```bash
   aws s3 cp s3://$S3_BUCKET/db/backups/suitora-<timestamp>.sql.gz /tmp/restore.sql.gz
   gunzip -k /tmp/restore.sql.gz -f
   ```

2. **Validate** it restores cleanly into a scratch DB (see
   **Verify Backup Integrity**).

3. **Apply to the target database** using the project restore script:

   ```bash
   npm run restore
   ```

   The `jobs/restore.ts` script replays the dump file against the configured
   `TURSO_DATABASE_URL`. For a local file DB:

   ```bash
   TURSO_DATABASE_URL=file:./data/suitora.db npm run restore
   ```

   For a remote Turso DB, point `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` at the
   target and re-run.

4. **Smoke-test** the app: hit `/api/health`, sign in, and confirm a recent
   analysis renders.

## Rollback

If the restored database causes errors, switch the app back to the pre-restore
snapshot taken in step 0, or restore the prior valid dump again. Keep the old
S3 dump untouched until the restore has been running for a full backup cycle.

## Verification / Completion

- [ ] Dump restored without SQL errors
- [ ] `/api/health` returns healthy
- [ ] Auth + a sample analysis work
- [ ] `backup_logs` / job logs show the restore attempt
- [ ] Incident postmortem filed if this was a real data-loss event

## Escalation

If a dump will not restore, or data appears partially corrupted after restore:

1. Do **not** overwrite the only good dump — preserve S3 artifacts.
2. Page the Platform/Data engineering lead immediately.
3. Engage Turso support with the database URL and dump metadata.
4. Keep the app in degraded/read-only mode if writes could compound the loss.
