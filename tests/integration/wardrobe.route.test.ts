import { describe, it, expect, vi, beforeEach } from "vitest";
import { userFixture } from "@/tests/fixtures";

const requireUserMock = vi.hoisted(() => vi.fn());
const enforceRateLimitMock = vi.hoisted(() => vi.fn());
const queriesMock = vi.hoisted(() => ({
  getWardrobeFavoritesByUserId: vi.fn(),
  getWardrobeFoldersByUserId: vi.fn(),
  getWardrobeFolderItemCounts: vi.fn(),
  toAnalysisResult: vi.fn((row: unknown) => row),
  updateWardrobeFolder: vi.fn(),
  deleteWardrobeFolder: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/rate-limit", () => ({
  stylistRateLimiter: {},
  enforceRateLimit: enforceRateLimitMock,
}));
vi.mock("@/lib/db/queries", () => queriesMock);

import { GET } from "@/app/api/wardrobe/route";
import { PATCH, DELETE } from "@/app/api/wardrobe/folders/[id]/route";
import { jsonRequest, callRoute } from "./helpers";

describe("/api/wardrobe", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(userFixture());
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: 0,
    });
    queriesMock.getWardrobeFoldersByUserId.mockResolvedValue([]);
    queriesMock.getWardrobeFolderItemCounts.mockResolvedValue([]);
    queriesMock.getWardrobeFavoritesByUserId.mockResolvedValue([]);
  });

  describe("GET /api/wardrobe", () => {
    it("rejects unauthenticated requests with 401", async () => {
      requireUserMock.mockResolvedValue(null);
      const res = await callRoute(GET, jsonRequest("http://localhost/api/wardrobe", "GET"));
      expect(res.status).toBe(401);
    });

    it("returns an empty wardrobe", async () => {
      const res = await callRoute(GET, jsonRequest("http://localhost/api/wardrobe", "GET"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.folders).toEqual([]);
      expect(body.items).toEqual([]);
    });

    it("joins folder item counts and resolves folder names", async () => {
      queriesMock.getWardrobeFoldersByUserId.mockResolvedValue([
        { id: "folder_1", name: "Work", createdAt: "2026-01-01" },
      ]);
      queriesMock.getWardrobeFolderItemCounts.mockResolvedValue([
        { folderId: "folder_1", itemCount: 3 },
      ]);
      queriesMock.getWardrobeFavoritesByUserId.mockResolvedValue([
        {
          favorite: {
            id: "fav_1",
            analysisId: "analysis_1",
            createdAt: "2026-01-02",
            inWardrobe: true,
            wardrobeTags: '["formal"]',
            wardrobeFolder: "folder_1",
            addedToWardrobeAt: "2026-01-02",
          },
          analysis: { id: "analysis_1", overallScore: 80 },
        },
      ]);

      const res = await callRoute(GET, jsonRequest("http://localhost/api/wardrobe", "GET"));
      const body = await res.json();
      expect(body.folders).toEqual([
        { id: "folder_1", name: "Work", itemCount: 3, createdAt: "2026-01-01" },
      ]);
      expect(body.items[0]).toMatchObject({
        id: "fav_1",
        wardrobeTags: ["formal"],
        wardrobeFolder: "folder_1",
        wardrobeFolderName: "Work",
      });
    });
  });

  describe("PATCH /api/wardrobe/folders/[id]", () => {
    it("rejects an invalid folder name with 400", async () => {
      const res = await callRoute(
        PATCH,
        jsonRequest("http://localhost/api/wardrobe/folders/folder_1", "PATCH", { name: "" }),
        { id: "folder_1" }
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("VALIDATION");
    });

    it("returns 404 when the folder does not exist", async () => {
      queriesMock.updateWardrobeFolder.mockResolvedValue(undefined);
      const res = await callRoute(
        PATCH,
        jsonRequest("http://localhost/api/wardrobe/folders/folder_missing", "PATCH", { name: "New" }),
        { id: "folder_missing" }
      );
      expect(res.status).toBe(404);
    });

    it("renames an existing folder", async () => {
      queriesMock.updateWardrobeFolder.mockResolvedValue({
        id: "folder_1",
        name: "Evening",
        createdAt: "2026-01-01",
      });
      const res = await callRoute(
        PATCH,
        jsonRequest("http://localhost/api/wardrobe/folders/folder_1", "PATCH", { name: "Evening" }),
        { id: "folder_1" }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.folder).toMatchObject({ id: "folder_1", name: "Evening" });
    });
  });

  describe("DELETE /api/wardrobe/folders/[id]", () => {
    it("returns 404 when the folder does not exist", async () => {
      queriesMock.deleteWardrobeFolder.mockResolvedValue(undefined);
      const res = await callRoute(
        DELETE,
        jsonRequest("http://localhost/api/wardrobe/folders/folder_missing", "DELETE"),
        { id: "folder_missing" }
      );
      expect(res.status).toBe(404);
    });

    it("deletes an existing folder", async () => {
      queriesMock.deleteWardrobeFolder.mockResolvedValue({ id: "folder_1" });
      const res = await callRoute(
        DELETE,
        jsonRequest("http://localhost/api/wardrobe/folders/folder_1", "DELETE"),
        { id: "folder_1" }
      );
      expect(res.status).toBe(200);
    });
  });
});
