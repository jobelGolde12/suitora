import { describe, it, expect, vi, beforeEach } from "vitest";

const { cacheGet, cacheSet, redisMock } = vi.hoisted(() => ({
	cacheGet: vi.fn(),
	cacheSet: vi.fn(),
	redisMock: {
		scanStream: vi.fn(),
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

// Emulates an ioredis scanStream: an async iterable of key batches.
function scanBatches(...batches: string[][]): AsyncIterable<string[]> {
	return (async function* () {
		for (const batch of batches) {
			yield batch;
		}
	})();
}

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
		redisMock.scanStream.mockReset();
		redisMock.del.mockReset();
	});

	it("deletes keys matching the prefix via SCAN batches", async () => {
		redisMock.scanStream.mockReturnValueOnce(
			scanBatches(["trending:a", "trending:b"])
		);
		await invalidateTrendCache();
		expect(redisMock.scanStream).toHaveBeenCalledWith({ match: "trending:*" });
		expect(redisMock.del).toHaveBeenCalledWith(["trending:a", "trending:b"]);
	});

	it("skips deletion when no keys match", async () => {
		redisMock.scanStream.mockReturnValueOnce(scanBatches([]));
		await invalidateTrendCache();
		expect(redisMock.del).not.toHaveBeenCalled();
	});

	it("deletes each batch produced by the cursor", async () => {
		redisMock.scanStream.mockReturnValueOnce(
			scanBatches(["trending:1"], ["trending:2"])
		);
		await invalidateTrendCache();
		expect(redisMock.del).toHaveBeenCalledTimes(2);
		expect(redisMock.del).toHaveBeenNthCalledWith(1, ["trending:1"]);
		expect(redisMock.del).toHaveBeenNthCalledWith(2, ["trending:2"]);
	});

	it("uses a custom prefix when provided", async () => {
		redisMock.scanStream.mockReturnValueOnce(
			scanBatches(["trending:custom:1"])
		);
		await invalidateTrendCache("trending:custom:");
		expect(redisMock.scanStream).toHaveBeenCalledWith({
			match: "trending:custom:*",
		});
		expect(redisMock.del).toHaveBeenCalledWith(["trending:custom:1"]);
	});
});
