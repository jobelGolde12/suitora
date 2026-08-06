import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { userFixture } from "@/tests/fixtures";

const requireUserMock = vi.hoisted(() => vi.fn());
const enforceRateLimitMock = vi.hoisted(() => vi.fn());
const cloudinaryMock = vi.hoisted(() => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/rate-limit", () => ({
  uploadRateLimiter: {},
  enforceRateLimit: enforceRateLimitMock,
}));
vi.mock("@/drizzle", async () => {
  const { makeDrizzleModule } = await import("@/tests/helpers/mocks");
  return makeDrizzleModule();
});
vi.mock("@/lib/storage/cloudinary", () => cloudinaryMock);

import { NextRequest } from "next/server";
import { POST, DELETE } from "@/app/api/uploads/route";
import { callRoute } from "./helpers";

const CLOUDINARY_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function formDataRequest(url: string, file?: File): NextRequest {
  const form = new FormData();
  if (file) form.append("file", file);
  return new NextRequest(url, { method: "POST", body: form });
}

function deleteRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "DELETE" });
}

const VALID_FILE = () => new File(["fake-image-bytes"], "dress.jpg", { type: "image/jpeg" });

describe("/api/uploads", () => {
  beforeEach(() => {
    requireUserMock.mockResolvedValue(userFixture());
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 0,
    });
    for (const key of CLOUDINARY_ENV) delete process.env[key];
  });

  afterEach(() => {
    for (const key of CLOUDINARY_ENV) delete process.env[key];
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("rejects unauthenticated requests with 401", async () => {
      requireUserMock.mockResolvedValue(null);
      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads"));
      expect(res.status).toBe(401);
    });

    it("rejects requests over the rate limit with 429", async () => {
      enforceRateLimitMock.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60_000,
      });
      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads", VALID_FILE()));
      expect(res.status).toBe(429);
    });

    it("rejects a request with no file", async () => {
      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/file/i);
    });

    it("rejects an unsupported image type", async () => {
      const bad = new File(["x"], "a.gif", { type: "image/gif" });
      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads", bad));
      expect(res.status).toBe(400);
    });

    it("stores a local data-URL fallback when Cloudinary is unconfigured", async () => {
      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads", VALID_FILE()));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toMatch(/^data:image\/jpeg;base64,/);
      expect(body.publicId).toMatch(/^local_/);
      expect(cloudinaryMock.uploadToCloudinary).not.toHaveBeenCalled();
    });

    it("uploads to Cloudinary when configured", async () => {
      process.env.CLOUDINARY_CLOUD_NAME = "cloud";
      process.env.CLOUDINARY_API_KEY = "key";
      process.env.CLOUDINARY_API_SECRET = "secret";
      cloudinaryMock.uploadToCloudinary.mockResolvedValue({
        url: "https://res.cloudinary.com/cloud/image/upload/v1/suitora/uploads/x.jpg",
        publicId: "suitora/uploads/x",
        width: 1200,
        height: 1600,
        format: "jpg",
        bytes: 42,
      });

      const res = await callRoute(POST, formDataRequest("http://localhost/api/uploads", VALID_FILE()));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toContain("cloudinary.com");
      expect(cloudinaryMock.uploadToCloudinary).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE", () => {
    it("rejects unauthenticated requests with 401", async () => {
      requireUserMock.mockResolvedValue(null);
      const res = await callRoute(DELETE, deleteRequest("http://localhost/api/uploads?publicId=x"));
      expect(res.status).toBe(401);
    });

    it("requires a publicId", async () => {
      const res = await callRoute(DELETE, deleteRequest("http://localhost/api/uploads"));
      expect(res.status).toBe(400);
    });

    it("skips Cloudinary for local_ ids", async () => {
      const res = await callRoute(DELETE, deleteRequest("http://localhost/api/uploads?publicId=local_abc"));
      expect(res.status).toBe(200);
      expect(cloudinaryMock.deleteFromCloudinary).not.toHaveBeenCalled();
    });

    it("deletes from Cloudinary for hosted ids", async () => {
      process.env.CLOUDINARY_CLOUD_NAME = "cloud";
      process.env.CLOUDINARY_API_KEY = "key";
      process.env.CLOUDINARY_API_SECRET = "secret";
      cloudinaryMock.deleteFromCloudinary.mockResolvedValue(undefined);

      const res = await callRoute(
        DELETE,
        deleteRequest("http://localhost/api/uploads?publicId=suitora/uploads/x")
      );
      expect(res.status).toBe(200);
      expect(cloudinaryMock.deleteFromCloudinary).toHaveBeenCalledWith("suitora/uploads/x");
    });
  });
});
