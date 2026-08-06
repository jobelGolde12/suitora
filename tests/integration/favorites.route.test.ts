import { describe, it, expect, vi, beforeEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const queriesMock = vi.hoisted(() => ({
  getFavoritesByUserId: vi.fn(),
  getWardrobeFolderById: vi.fn(),
  toAnalysisResult: vi.fn((row: unknown) => row),
  updateFavoriteWardrobe: vi.fn(),
  getFavoriteAnalysisIds: vi.fn(),
  getAnalysesByUserId: vi.fn(),
  getDashboardStats: vi.fn(),
  getProfileByUserId: vi.fn(),
  getStylistMessages: vi.fn(),
  countStylistMessagesThisMonth: vi.fn(),
  addStylistMessage: vi.fn(),
  getWardrobeFavoritesByUserId: vi.fn(),
  getWardrobeFoldersByUserId: vi.fn(),
  parseJsonObject: vi.fn((v: string | null) => {
    if (!v) return null;
    try {
      const p = JSON.parse(v);
      return typeof p === "object" && !Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  }),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/queries", () => queriesMock);
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(async () => ({ success: true, limit: 30, remaining: 29, reset: 0 })),
  stylistRateLimiter: {},
  uploadRateLimiter: {},
  analysisRateLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));
vi.mock("@/drizzle", () => {
  const chain = {
    then: (onF: (v: unknown) => unknown) => Promise.resolve([]).then(onF),
  } as Record<string, unknown> & { [k: string]: unknown };
  for (const m of [
    "select", "from", "where", "and", "insert", "values",
    "onConflictDoNothing", "update", "set", "returning",
  ]) {
    chain[m] = () => chain;
  }
  return {
    dbWrite: chain,
    dbRead: chain,
    schema: { users: {}, products: {}, analyses: {}, favorites: {} },
  };
});

import { GET, POST, PATCH, DELETE } from "@/app/api/favorites/route";
import { jsonRequest, callRoute } from "./helpers";

const USER = { id: "user_1", email: "u@example.com", name: "U" };

describe("favorites API", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(USER);
    queriesMock.getFavoritesByUserId.mockResolvedValue([]);
  });

  it("rejects unauthenticated requests with 401", async () => {
    requireUserMock.mockResolvedValue(null);
    const res = await callRoute(GET, jsonRequest("http://localhost/api/favorites", "GET"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("lists favorites for an authenticated user", async () => {
    queriesMock.getFavoritesByUserId.mockResolvedValue([
      {
        favorite: {
          id: "fav_1",
          analysisId: "analysis_1",
          createdAt: "2026-01-01",
          inWardrobe: false,
          wardrobeTags: "[\"tag\"]",
          wardrobeFolder: null,
          addedToWardrobeAt: null,
        },
        analysis: { id: "analysis_1", title: "A" },
      },
    ]);

    const res = await callRoute(GET, jsonRequest("http://localhost/api/favorites", "GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.favorites).toHaveLength(1);
    expect(body.favorites[0].wardrobeTags).toEqual(["tag"]);
  });

  it("validates the POST body", async () => {
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/favorites", "POST", {})
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
  });

  it("adds a favorite with a valid body", async () => {
    queriesMock.getFavoritesByUserId.mockResolvedValue([]);
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/favorites", "POST", { analysisId: "analysis_1" })
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 when patching a favorite that does not exist", async () => {
    queriesMock.getFavoritesByUserId.mockResolvedValue([]);
    const res = await callRoute(
      PATCH,
      jsonRequest("http://localhost/api/favorites", "PATCH", {
        analysisId: "analysis_x",
        wardrobeTags: ["x"],
      })
    );
    expect(res.status).toBe(404);
  });

  it("rejects deleting without an id", async () => {
    const res = await callRoute(DELETE, jsonRequest("http://localhost/api/favorites", "DELETE", {}));
    expect(res.status).toBe(400);
  });
});
