import { describe, it, expect, vi, beforeEach } from "vitest";

const { cacheGet, cacheSet, redisMock } = vi.hoisted(() => ({
	cacheGet: vi.fn(),
	cacheSet: vi.fn(),
	redisMock: {
		keys: vi.fn(),
		del: vi.fn(),
	},
}));

vi.mock("@/lib/cache", () => ({
	get: cacheGet,
	set: cacheSet,
	del: vi.fn(),
	flushAll: vi.fn(),
	getRedisClient: () => redisMock,
}));

import { getCached, setCached, invalidateTrendCache, buildTrendCacheKey } from "./cache";

describe("buildTrendCacheKey", () => {
	it("builds a key with sorted params", () => {
		const key = buildTrendCacheKey({ category: "dresses", page: 2, limit: 10 });
		expect(key).toBe("trending:category=dresses&limit=10&page=2");
	});

	it("omits undefined and empty-string values", () => {
		const key = buildTrendCacheKey({ category: "shoes", page: undefined, limit: 0, brand: "" });
		expect(key).toBe("trending:category=shoes&limit=0");
	});

	it("uses 'default' when no params are provided", () => {
		expect(buildTrendCacheKey({})).toBe("trending:default");
	});
});

describe("getCached", () => {
	it("delegates to cache.get", async () => {
		cacheGet.mockResolvedValueOnce({ foo: "bar" });
		const result = await getCached("trending:abc");
		expect(cacheGet).toHaveBeenCalledWith("trending:abc");
		expect(result).toEqual({ foo: "bar" });
	});

	it("returns null when cache miss", async () => {
		cacheGet.mockResolvedValueOnce(null);
		const result = await getCached("trending:miss");
		expect(result).toBeNull();
	});
});

describe("setCached", () => {
	it("calls cache.set with data and default TTL", async () => {
		cacheSet.mockResolvedValueOnce(undefined);
		await setCached("trending:key", { items: [1] });
		expect(cacheSet).toHaveBeenCalledWith("trending:key", { items: [1] }, 300);
	});

	it("honours a custom TTL", async () => {
		cacheSet.mockResolvedValueOnce(undefined);
		await setCached("trending:slow", { items: [] }, 600);
		expect(cacheSet).toHaveBeenCalledWith("trending:slow", { items: [] }, 600);
	});
});

describe("invalidateTrendCache", () => {
	beforeEach(() => {
		redisMock.keys.mockReset();
		redisMock.del.mockReset();
	});

	it("deletes keys matching the prefix", async () => {
		redisMock.keys.mockResolvedValueOnce(["trending:a", "trending:b"]);
		await invalidateTrendCache();
		expect(redisMock.keys).toHaveBeenCalledWith("trending:*");
		expect(redisMock.del).toHaveBeenCalledWith(["trending:a", "trending:b"]);
	});

	it("skips deletion when no keys match", async () => {
		redisMock.keys.mockResolvedValueOnce([]);
		await invalidateTrendCache();
		expect(redisMock.del).not.toHaveBeenCalled();
	});

	it("uses a custom prefix when provided", async () => {
		redisMock.keys.mockResolvedValueOnce(["trending:custom:1"]);
		await invalidateTrendCache("trending:custom:");
		expect(redisMock.keys).toHaveBeenCalledWith("trending:custom:*");
		expect(redisMock.del).toHaveBeenCalledWith(["trending:custom:1"]);
	});
});
