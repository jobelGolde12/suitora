import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const queriesMock = vi.hoisted(() => ({
  addStylistMessage: vi.fn(),
  countStylistMessagesThisMonth: vi.fn(),
  getStylistMessages: vi.fn(),
  getProfileByUserId: vi.fn(),
  getAnalysesByUserId: vi.fn(),
  getFavoritesByUserId: vi.fn(),
  getDashboardStats: vi.fn(),
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
const generateStylistReplyMock = vi.hoisted(() => vi.fn());
const getCurrentSeasonMock = vi.hoisted(() => vi.fn());
const enforceRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/db/queries", () => queriesMock);
vi.mock("@/lib/ai/stylist", () => ({ generateStylistReply: generateStylistReplyMock }));
vi.mock("@/lib/season", () => ({ getCurrentSeason: getCurrentSeasonMock }));
vi.mock("@/lib/rate-limit", () => ({
  stylistRateLimiter: {},
  enforceRateLimit: enforceRateLimitMock,
}));

import { GET, POST } from "@/app/api/stylist/route";
import { jsonRequest, callRoute } from "./helpers";

const USER = { id: "user_1", email: "alex@example.com", name: "Alex" };

// The route captures STYLIST_MONTHLY_LIMIT from the environment at module load;
// assert against the same source so the test is environment-independent.
const monthlyLimit = () => Number(process.env.STYLIST_MONTHLY_LIMIT || 10);

const DEFAULT_EMPTY = {
  profile: null,
  analyses: [],
  favorites: [],
  stats: { totalAnalyses: 0, averageScore: null },
  wardrobeRows: [],
  folders: [],
  messages: [],
  used: 0,
};

function stubEmptyContext() {
  queriesMock.getProfileByUserId.mockResolvedValue(DEFAULT_EMPTY.profile);
  queriesMock.getAnalysesByUserId.mockResolvedValue(DEFAULT_EMPTY.analyses);
  queriesMock.getFavoritesByUserId.mockResolvedValue(DEFAULT_EMPTY.favorites);
  queriesMock.getDashboardStats.mockResolvedValue(DEFAULT_EMPTY.stats);
  queriesMock.getWardrobeFavoritesByUserId.mockResolvedValue(DEFAULT_EMPTY.wardrobeRows);
  queriesMock.getWardrobeFoldersByUserId.mockResolvedValue(DEFAULT_EMPTY.folders);
  queriesMock.getStylistMessages.mockResolvedValue(DEFAULT_EMPTY.messages);
  queriesMock.countStylistMessagesThisMonth.mockResolvedValue(DEFAULT_EMPTY.used);
}

describe("/api/stylist", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(USER);
    getCurrentSeasonMock.mockReturnValue({ label: "Summer" });
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: 0,
    });
    generateStylistReplyMock.mockResolvedValue("A great fit for you.");
    stubEmptyContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("rejects unauthenticated requests with 401", async () => {
      requireUserMock.mockResolvedValue(null);
      const res = await callRoute(GET, jsonRequest("http://localhost/api/stylist", "GET"));
      expect(res.status).toBe(401);
    });

    it("returns the conversation history and monthly usage", async () => {
      queriesMock.getStylistMessages.mockResolvedValue([
        { id: "m1", role: "user", content: "hi" },
        { id: "m2", role: "assistant", content: "hello" },
      ]);
      queriesMock.countStylistMessagesThisMonth.mockResolvedValue(4);

      const res = await callRoute(GET, jsonRequest("http://localhost/api/stylist", "GET"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toHaveLength(2);
      expect(body.usage).toEqual({
        used: 4,
        limit: monthlyLimit(),
        remaining: monthlyLimit() - 4,
      });
    });

    it("clamps the limit parameter to 100", async () => {
      const res = await callRoute(
        GET,
        jsonRequest("http://localhost/api/stylist?limit=9999", "GET")
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.limit).toBe(100);
    });
  });

  describe("POST", () => {
    it("rejects an empty message with 400", async () => {
      const res = await callRoute(POST, jsonRequest("http://localhost/api/stylist", "POST", { message: "" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION");
    });

    it("rejects requests over the rate limit with 429", async () => {
      enforceRateLimitMock.mockResolvedValue({
        success: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 60_000,
      });
      const res = await callRoute(POST, jsonRequest("http://localhost/api/stylist", "POST", { message: "hi" }));
      expect(res.status).toBe(429);
      expect(generateStylistReplyMock).not.toHaveBeenCalled();
    });

    it("rejects requests past the monthly limit with 429", async () => {
      queriesMock.countStylistMessagesThisMonth.mockResolvedValue(monthlyLimit());
      const res = await callRoute(POST, jsonRequest("http://localhost/api/stylist", "POST", { message: "hi" }));
      expect(res.status).toBe(429);
      expect(generateStylistReplyMock).not.toHaveBeenCalled();
    });

    it("persists the exchange and returns the reply with usage", async () => {
      const res = await callRoute(POST, jsonRequest("http://localhost/api/stylist", "POST", { message: "What suits me?" }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("A great fit for you.");
      expect(body.usage).toEqual({
        used: 1,
        limit: monthlyLimit(),
        remaining: monthlyLimit() - 1,
      });

      expect(queriesMock.addStylistMessage).toHaveBeenNthCalledWith(1, "user_1", "user", "What suits me?");
      expect(queriesMock.addStylistMessage).toHaveBeenNthCalledWith(2, "user_1", "assistant", "A great fit for you.");
      expect(generateStylistReplyMock).toHaveBeenCalledTimes(1);
    });
  });
});
