import { describe, it, expect } from "vitest";
import { computeTryOnStats } from "./monitoring";

describe("computeTryOnStats", () => {
  it("returns zeroed stats when no try-ons exist", () => {
    const stats = computeTryOnStats({
      completed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      processing: 0,
      avgLatencyMs: null,
    });

    expect(stats).toEqual({
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      pending: 0,
      processing: 0,
      failureRate: null,
      avgLatencyMs: null,
    });
  });

  it("computes failure rate from completed + failed only", () => {
    const stats = computeTryOnStats({
      completed: 8,
      failed: 2,
      skipped: 5,
      pending: 1,
      processing: 0,
      avgLatencyMs: 1234.6,
    });

    expect(stats.total).toBe(16);
    expect(stats.failureRate).toBe(20); // 2/10
    expect(stats.avgLatencyMs).toBe(1235);
    expect(stats.skipped).toBe(5);
  });

  it("handles all-failed outcomes", () => {
    const stats = computeTryOnStats({
      completed: 0,
      failed: 3,
      skipped: 0,
      pending: 0,
      processing: 0,
      avgLatencyMs: null,
    });

    expect(stats.failureRate).toBe(100);
    expect(stats.avgLatencyMs).toBeNull();
  });

  it("coerces string counts from SQLite drivers", () => {
    const stats = computeTryOnStats({
      completed: "4" as unknown as number,
      failed: "1" as unknown as number,
      skipped: "0" as unknown as number,
      pending: "0" as unknown as number,
      processing: "0" as unknown as number,
      avgLatencyMs: "500.4" as unknown as number,
    });

    expect(stats.total).toBe(5);
    expect(stats.failureRate).toBe(20);
    expect(stats.avgLatencyMs).toBe(500);
  });

  it("rounds failure rate to one decimal", () => {
    const stats = computeTryOnStats({
      completed: 2,
      failed: 1,
      skipped: 0,
      pending: 0,
      processing: 0,
      avgLatencyMs: 100,
    });

    // 1/3 ≈ 33.333 → 33.3
    expect(stats.failureRate).toBe(33.3);
  });
});
