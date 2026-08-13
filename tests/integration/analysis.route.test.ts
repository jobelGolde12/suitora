import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const enforceRateLimitMock = vi.hoisted(() => vi.fn());
const extractProductFromUrlCachedMock = vi.hoisted(() => vi.fn());
const analyzeWithVisionMock = vi.hoisted(() => vi.fn());
const syncTryOnLifecycleMock = vi.hoisted(() => vi.fn());
const assertSafeHttpUrlMock = vi.hoisted(() => vi.fn());
const queriesMock = vi.hoisted(() => ({
  getAnalysesByUserId: vi.fn(),
  getFavoritesByUserId: vi.fn(),
  toAnalysisResult: vi.fn((row: unknown) => row),
  persistAnalysisEstimates: vi.fn(),
}));
const drizzleMock = vi.hoisted(() => {
  const makeChain = (resolveValue: unknown = []) => {
    const chain = {
      then: (onF: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(onF),
    } as Record<string, unknown> & { [k: string]: unknown };
    for (const m of [
      "select", "from", "where", "and", "insert", "values",
      "onConflictDoNothing", "update", "set", "returning",
    ]) {
      chain[m] = () => chain;
    }
    return chain;
  };
  return {
    dbWrite: makeChain(),
    dbRead: makeChain(),
    schema: { users: {}, products: {}, analyses: {} },
    makeChain,
  };
});

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/rate-limit", () => ({
  analysisRateLimiter: {},
  enforceRateLimit: enforceRateLimitMock,
}));
vi.mock("@/lib/ai/product-extraction", () => ({
  extractProductFromUrlCached: extractProductFromUrlCachedMock,
}));
vi.mock("@/lib/ai/vision", () => ({ analyzeWithVision: analyzeWithVisionMock }));
vi.mock("@/lib/ai/providers", () => ({}));
vi.mock("@/lib/ai/tryon/lifecycle", () => ({ syncTryOnLifecycle: syncTryOnLifecycleMock }));
vi.mock("@/lib/ai/tryon", () => ({ mapCategoryToTryOn: (c?: string) => c ?? "tops" }));
vi.mock("@/lib/security/ssrf", () => ({ assertSafeHttpUrl: assertSafeHttpUrlMock }));
vi.mock("@/lib/db/queries", () => queriesMock);
vi.mock("@/lib/storage/cloudinary", () => ({ deleteCloudinaryImageFromUrl: vi.fn() }));
vi.mock("@/drizzle", () => drizzleMock);

import { GET, POST, DELETE } from "@/app/api/analysis/route";
import { jsonRequest, callRoute } from "./helpers";

const USER = { id: "user_1", email: "alex@example.com", name: "Alex" };

describe("/api/analysis", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(USER);
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: 0,
    });
    assertSafeHttpUrlMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    drizzleMock.dbRead = drizzleMock.makeChain();
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("rejects unauthenticated requests with 401", async () => {
      requireUserMock.mockResolvedValue(null);
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", { productImageUpload: "https://img" })
      );
      expect(res.status).toBe(401);
    });

    it("rejects requests over the daily rate limit with 429", async () => {
      enforceRateLimitMock.mockResolvedValue({
        success: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 86_400_000,
      });
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", { productImageUpload: "https://img" })
      );
      expect(res.status).toBe(429);
    });

    it("validates the request body", async () => {
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", { productUrl: "not-a-url" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION");
    });

    it("requires a user self image when none is provided", async () => {
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", { productImageUpload: "https://img" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/self image/i);
    });

    it("uses the provided self image and returns a pending analysis", async () => {
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", {
          productImageUpload: "https://img",
          userImageUrl: "https://self",
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.analysisId).toMatch(/^analysis_/);
    });

    it("accepts large data-URL image references (dev fallback)", async () => {
      const dataUrl = `data:image/jpeg;base64,${"a".repeat(1024 * 1024)}`;
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", {
          productImageUpload: dataUrl,
          userImageUrl: dataUrl,
        })
      );
      expect(res.status).toBe(200);
    });

    it("returns 400 when URL extraction fails", async () => {
      extractProductFromUrlCachedMock.mockRejectedValue(new Error("provider down"));
      const res = await callRoute(
        POST,
        jsonRequest("http://localhost/api/analysis", "POST", {
          productUrl: "https://example.com/product",
          userImageUrl: "https://self",
        })
      );
      expect(res.status).toBe(400);
      expect(assertSafeHttpUrlMock).toHaveBeenCalledWith("https://example.com/product");
    });
  });

  describe("GET", () => {
    it("returns the paginated history with favorite flags", async () => {
      queriesMock.getAnalysesByUserId.mockResolvedValue([{ id: "a1", overallScore: 80 }]);
      queriesMock.getFavoritesByUserId.mockResolvedValue([
        { favorite: { analysisId: "a1" } },
      ]);

      const res = await callRoute(GET, jsonRequest("http://localhost/api/analysis", "GET"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.analyses).toHaveLength(1);
      expect(body.analyses[0]).toMatchObject({ id: "a1", isFavorite: true });
    });

    it("rejects an invalid query with 400", async () => {
      const res = await callRoute(
        GET,
        jsonRequest("http://localhost/api/analysis?id=".concat("x".repeat(200)), "GET")
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for an analysis the user does not own", async () => {
      const res = await callRoute(GET, jsonRequest("http://localhost/api/analysis?id=analysis_missing", "GET"));
      expect(res.status).toBe(404);
    });

    it("returns a completed analysis immediately", async () => {
      const completed = {
        id: "analysis_1",
        status: "completed",
        tryOnStatus: "completed",
        createdAt: new Date().toISOString(),
      };
      drizzleMock.dbRead = drizzleMock.makeChain([completed]);

      const res = await callRoute(GET, jsonRequest("http://localhost/api/analysis?id=analysis_1", "GET"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.analysis).toMatchObject({ id: "analysis_1", status: "completed" });
      expect(syncTryOnLifecycleMock).toHaveBeenCalled();
    });

    it("reports the current pipeline stage for a pending analysis", async () => {
      const pending = {
        id: "analysis_2",
        status: "pending",
        tryOnStatus: "pending",
        createdAt: new Date(Date.now() - 2_000).toISOString(),
      };
      drizzleMock.dbRead = drizzleMock.makeChain([pending]);

      const res = await callRoute(GET, jsonRequest("http://localhost/api/analysis?id=analysis_2", "GET"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stage).toBe("analyzing");
      expect(body.progress).toBe(35);
    });
  });

  describe("DELETE", () => {
    it("requires an id with 400", async () => {
      const res = await callRoute(DELETE, jsonRequest("http://localhost/api/analysis", "DELETE"));
      expect(res.status).toBe(400);
    });

    it("returns 404 when the analysis does not exist", async () => {
      const res = await callRoute(
        DELETE,
        jsonRequest("http://localhost/api/analysis?id=analysis_missing", "DELETE")
      );
      expect(res.status).toBe(404);
    });
  });
});
