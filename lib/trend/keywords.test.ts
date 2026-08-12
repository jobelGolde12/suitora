import { describe, it, expect } from "vitest";
import {
	getKeywords,
	getKeywordsForCategory,
	getRandomKeyword,
} from "./keywords";

describe("getKeywords", () => {
	it("returns the default count (5) when no count is given", () => {
		const result = getKeywords();
		expect(result).toHaveLength(5);
	});

	it("returns the requested count bounded by the base pool", () => {
		const result = getKeywords(3);
		expect(result).toHaveLength(3);
	});

	it("returns exactly the requested count", () => {
		const result = getKeywords(999);
		expect(result).toHaveLength(999);
	});

	it("returns unique keywords within a single call", () => {
		const result = getKeywords(20);
		expect(new Set(result).size).toBe(result.length);
	});

	it("rotates selection on subsequent calls (changes starting keyword)", () => {
		const first = getKeywords(8);
		const second = getKeywords(8);
		expect(first[0]).not.toBe(second[0]);
	});

	it("includes seasonal keywords when count exceeds the base pool", () => {
		const result = getKeywords(70, "summer");
		const seasonal = [
			"summer fashion trends", "beach cover up", "swimwear popular",
			"linen summer outfit", "shorts casual summer",
		];
		const found = result.filter((k) => seasonal.includes(k));
		expect(found.length).toBeGreaterThan(0);
	});

	it("respects an explicit season override for seasonal pool", () => {
		const result = getKeywords(70, "winter");
		const seasonal = [
			"winter fashion trends", "cashmere sweater luxury", "wool coat warm",
			"thermal leggings winter", "puffer jacket insulated",
		];
		const found = result.filter((k) => seasonal.includes(k));
		expect(found.length).toBeGreaterThan(0);
	});

	it("does not include seasonal keywords when season is unknown", () => {
		const result = getKeywords(70, "monsoon");
		const allSeasonal = new Set(
			Object.values({
				summer: ["summer fashion trends", "beach cover up", "swimwear popular", "linen summer outfit", "shorts casual summer"],
				winter: ["winter fashion trends", "cashmere sweater luxury", "wool coat warm", "thermal leggings winter", "puffer jacket insulated"],
				fall: ["fall fashion trends", "autumn layers outfit", "leather boots fall", "knit sweater cozy", "plaid shirt fall"],
				spring: ["spring fashion trends", "spring collection new", "lightweight jacket spring", "floral dress spring"],
			}).flat()
		);
		result.forEach((kw) => {
			expect(allSeasonal.has(kw)).toBe(false);
		});
	});
});

describe("getKeywordsForCategory", () => {
	it("returns keywords for a known category", () => {
		const result = getKeywordsForCategory("dresses");
		expect(result).toEqual([
			"trending dresses 2026",
			"summer dress women",
			"midi dress fashion",
			"maxi dress new arrivals",
			"cocktail dress popular",
			"wrap dress trending",
			"slip dress women",
			"sundress casual",
		]);
	});

	it("is case-insensitive on the category name", () => {
		const result = getKeywordsForCategory("DRESSES");
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns an empty array for an unknown category", () => {
		expect(getKeywordsForCategory("nonexistent")).toEqual([]);
	});
});

describe("getRandomKeyword", () => {
	it("returns a non-empty string", () => {
		const result = getRandomKeyword();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("always returns a base-pool keyword for count=1", () => {
		const baseAll = [
			"trending dresses 2026", "summer dress women", "midi dress fashion",
			"maxi dress new arrivals", "cocktail dress popular", "wrap dress trending",
			"slip dress women", "sundress casual",
			"women's tops trending", "silk blouse fashion", "linen shirt men",
			"cropped top popular", "graphic tee trending", "knit sweater new",
			"oxford shirt men", "camisole top women",
			"wide leg trousers trending", "high waist jeans popular", "linen pants men",
			"cargo pants fashion", "pleated skirt women", "tailored trousers new",
			"denim shorts summer", "chinos men casual",
			"trench coat trending", "denim jacket popular", "blazer women fashion",
			"leather jacket men", "puffer jacket winter", "windbreaker casual",
			"wool coat women", "bomber jacket trending",
			"sneakers trending 2026", "white leather sneakers", "ankle boots women",
			"loafers men popular", "sandals summer fashion", "platform shoes women",
			"running shoes new", "canvas shoes casual",
			"crossbody bag trending", "gold jewelry popular", "sunglasses fashion 2026",
			"watch men minimalist", "scarf women silk", "belt leather popular",
			"hat bucket trending", "tote bag canvas",
			"athleisure set women", "yoga pants trending", "sports bra popular",
			"gym shorts men", "running leggings", "activewear set matching",
			"training shoes popular", "sports jacket lightweight",
			"blazer women formal", "tailored suit men", "cocktail outfit women",
			"dress shirt formal", "pencil skirt office", "trousers formal men",
			"sheath dress professional", "waistcoat vest men",
		];
		for (let i = 0; i < 20; i++) {
			expect(baseAll).toContain(getRandomKeyword("summer"));
		}
	});

	it("returns a string even with an unknown season", () => {
		const result = getRandomKeyword("monsoon");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});
});
