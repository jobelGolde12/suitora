import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const queriesMock = vi.hoisted(() => ({
  getDashboardStats: vi.fn(),
  getAnalysesByUserId: vi.fn(),
  getFavoriteAnalysisIds: vi.fn(),
  toAnalysisResult: vi.fn((row: unknown) => row),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/queries", () => queriesMock);

import { GET } from "@/app/api/dashboard/stats/route";
import { jsonRequest, callRoute } from "./helpers";

const USER = { id: "user_1", email: "alex@example.com", name: "Alex" };

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(USER);
    queriesMock.getDashboardStats.mockResolvedValue({
      totalAnalyses: 0,
      averageScore: null,
    });
    queriesMock.getAnalysesByUserId.mockResolvedValue([]);
    queriesMock.getFavoriteAnalysisIds.mockResolvedValue(new Set());
  });

  it("rejects unauthenticated requests with 401", async () => {
    requireUserMock.mockResolvedValue(null);
    const res = await callRoute(GET, jsonRequest("http://localhost/api/dashboard/stats", "GET"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns empty state with the default score trend", async () => {
    const res = await callRoute(GET, jsonRequest("http://localhost/api/dashboard/stats", "GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.totalAnalyses).toBe(0);
    expect(body.recentAnalyses).toEqual([]);
    expect(body.scoreTrend).toEqual([70, 75, 80]);
    expect(body.trendDates).toEqual([]);
    expect(body.bestScore).toBeNull();
    expect(body.userName).toBe("Alex");
  });

  it("derives the username from the email when no name is set", async () => {
    requireUserMock.mockResolvedValue({ ...USER, name: "" });
    const res = await callRoute(GET, jsonRequest("http://localhost/api/dashboard/stats", "GET"));
    const body = await res.json();
    expect(body.userName).toBe("alex");
  });

  it("marks favorited analyses and orders the score trend oldest-first", async () => {
    // After consolidation, getAnalysesByUserId is called once with limit=10.
    // Recent analyses are the first 5 items from that single result set.
    queriesMock.getAnalysesByUserId.mockResolvedValue([
      // newest first (as the query returns them)
      { id: "a2", overallScore: 90, createdAt: "2026-01-03" },
      { id: "a1", overallScore: 40, createdAt: "2026-01-01" },
    ]);
    queriesMock.getFavoriteAnalysisIds.mockResolvedValue(new Set(["a2"]));

    const res = await callRoute(GET, jsonRequest("http://localhost/api/dashboard/stats", "GET"));
    const body = await res.json();

    // recentAnalyses is slice(0,5) of the single query result
    expect(body.recentAnalyses).toHaveLength(2);
    expect(body.recentAnalyses[0]).toMatchObject({ id: "a2", isFavorite: true });
    expect(body.recentAnalyses[1]).toMatchObject({ id: "a1", isFavorite: false });
    expect(body.scoreTrend).toEqual([40, 90]);
    expect(body.trendDates).toEqual(["2026-01-01", "2026-01-03"]);
    expect(body.bestScore).toBe(90);
  });
});
