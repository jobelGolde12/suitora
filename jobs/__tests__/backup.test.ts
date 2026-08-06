import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/storage/s3", () => ({
  s3Put: vi.fn(),
  s3Get: vi.fn(),
  s3List: vi.fn(),
  s3Delete: vi.fn(),
  getS3Config: vi.fn(() => ({
    endpoint: "https://example.invalid",
    region: "us-east-1",
    bucket: "backups",
    accessKeyId: "ak",
    secretAccessKey: "sk",
  })),
}));

import { s3List, s3Delete } from "@/lib/storage/s3";
import { pruneBackups } from "@/jobs/backup";

const mockedS3List = vi.mocked(s3List);
const mockedS3Delete = vi.mocked(s3Delete);

function keyFor(date: string): string {
  return `db/backups/suitora-${date.replace(/[:.]/g, "-")}.sql.gz`;
}

const JUNE_15 = "2026-06-15T000000000Z";
const JUNE_16 = "2026-06-16T000000000Z";
const JULY_01 = "2026-07-01T000000000Z";
const JULY_10 = "2026-07-10T000000000Z";
const AUG_01 = "2026-08-01T000000000Z";
const AUG_05 = "2026-08-05T000000000Z";

describe("pruneBackups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the newest dumps and one anchor per recent month", async () => {
    const all = [JUNE_15, JUNE_16, JULY_01, JULY_10, AUG_01, AUG_05].map(keyFor);
    mockedS3List.mockResolvedValue(
      all.map((key) => ({ key, lastModified: null }))
    );
    mockedS3Delete.mockResolvedValue();

    const deleted = await pruneBackups();

    // RETAIN_DAILY default 30 → all 6 kept for daily; months (06,07,08) anchors
    // also kept. Nothing should be deleted.
    expect(deleted).toBe(0);
    expect(mockedS3Delete).not.toHaveBeenCalled();
  });

  it("deletes oldest dumps beyond daily retention", async () => {
    // 45 consecutive dumps in June 2026 → keep the 30 newest, delete the 15 oldest.
    const manyKeys: string[] = [];
    for (let day = 1; day <= 45; day++) {
      const iso = `2026-06-${String(day).padStart(2, "0")}T000000000Z`;
      manyKeys.push(keyFor(iso));
    }
    mockedS3List.mockResolvedValue(
      manyKeys.map((key) => ({ key, lastModified: null }))
    );
    mockedS3Delete.mockResolvedValue();

    const deleted = await pruneBackups();

    expect(deleted).toBe(15);
    const deletedKeys = mockedS3Delete.mock.calls.map((c) => c[0]);
    expect(deletedKeys).toContain(keyFor("2026-06-01T000000000Z"));
    expect(deletedKeys).not.toContain(keyFor("2026-06-16T000000000Z"));
    expect(deletedKeys).toHaveLength(15);
  });

  it("protects a monthly anchor older than the daily retention window", async () => {
    // June has a single dump (month anchor candidate), July has 10 dumps,
    // August has 30. Daily retention (30) keeps all of August; the July anchor
    // (newest July dump) and the June anchor must survive as monthly anchors.
    const keys = [
      keyFor("2026-06-01T000000000Z"),
      ...Array.from({ length: 10 }, (_, i) =>
        keyFor(`2026-07-${String(i + 1).padStart(2, "0")}T000000000Z`)
      ),
      ...Array.from({ length: 30 }, (_, i) =>
        keyFor(`2026-08-${String(i + 1).padStart(2, "0")}T000000000Z`)
      ),
    ];
    mockedS3List.mockResolvedValue(
      keys.map((key) => ({ key, lastModified: null }))
    );
    mockedS3Delete.mockResolvedValue();

    const deleted = await pruneBackups();

    // Deleted: the 9 oldest July dumps. June anchor + July anchor + all August kept.
    expect(deleted).toBe(9);
    const deletedKeys = mockedS3Delete.mock.calls.map((c) => c[0]);
    expect(deletedKeys).toContain(keyFor("2026-07-01T000000000Z"));
    expect(deletedKeys).toContain(keyFor("2026-07-09T000000000Z"));
    expect(deletedKeys).not.toContain(keyFor("2026-06-01T000000000Z"));
    expect(deletedKeys).not.toContain(keyFor("2026-07-10T000000000Z"));
    expect(deletedKeys).not.toContain(keyFor("2026-08-30T000000000Z"));
  });

  it("returns 0 when there are no backups", async () => {
    mockedS3List.mockResolvedValue([]);
    const deleted = await pruneBackups();
    expect(deleted).toBe(0);
    expect(mockedS3Delete).not.toHaveBeenCalled();
  });
});
