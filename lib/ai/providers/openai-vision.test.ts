import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
	getLogger: () => mockLogger,
}));

vi.mock("@/lib/metrics", () => ({
	observeUpstream: vi.fn(),
}));

import { createOpenAIProvider } from "./openai-vision";

const VALID_JSON_CONTENT = JSON.stringify({
	scores: { overall: 85, body: 80, style: 75, color: 90 },
	traits: {
		bodyShape: "hourglass",
		skinTone: "warm",
		faceShape: "oval",
		styleType: "casual",
	},
	height: 170,
	heightConfidence: 0.85,
	weight: 60,
	weightConfidence: 0.75,
	recommendations: ["Pair with neutral tones", "A-line silhouette", "Layer with a blazer"],
	colorAnalysis: {
		primaryColors: ["#1a2b3c", "#4d5e6f", "#789abc"],
		recommendedColors: ["#e8d5b7", "#4a90d9", "#2ecc71", "#f39c12"],
		avoidColors: ["#ff6b6b", "#98fb98"],
	},
});

const INPUT = {
	userImageUrl: "https://cdn.example.com/self.jpg",
	clothingImageUrl: "https://cdn.example.com/dress.jpg",
};

function mockFetchResponse(resolvers: Array<() => unknown>) {
	return vi.fn().mockImplementation(() => {
		const resolver = resolvers.shift();
		return Promise.resolve(resolver!());
	});
}

describe("createOpenAIProvider", () => {
	const provider = createOpenAIProvider();

	beforeEach(() => {
		mockLogger.error.mockClear();
		mockLogger.warn.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("throws when OPENAI_API_KEY is not configured", async () => {
		vi.stubEnv("OPENAI_API_KEY", "");
		await expect(provider.analyze(INPUT)).rejects.toThrow("OPENAI_API_KEY is not configured");
	});

	it("returns a parsed result on a successful response", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [{ message: { content: VALID_JSON_CONTENT } }],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const result = await provider.analyze(INPUT);
		expect(result.scores).toEqual({ overall: 85, body: 80, style: 75, color: 90 });
		expect(result.traits).toEqual({
			bodyShape: "hourglass",
			skinTone: "warm",
			faceShape: "oval",
			styleType: "casual",
		});
		expect(result.recommendations).toHaveLength(3);
		expect(result.colorAnalysis.primaryColors).toHaveLength(3);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on a non-ok, non-retryable response (e.g. 400)", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: false,
				status: 400,
				text: async () => "bad request",
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		await expect(provider.analyze(INPUT)).rejects.toThrow(/OpenAI API error: 400/);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("retries on retryable status codes (429) and succeeds on a later attempt", async () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0);

		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({ ok: false, status: 429, text: async () => "rate limited" }),
			() => ({ ok: false, status: 503, text: async () => "unavailable" }),
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [{ message: { content: VALID_JSON_CONTENT } }],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const promise = provider.analyze(INPUT);
		await vi.advanceTimersByTimeAsync(3000);

		const result = await promise;
		expect(result.scores.overall).toBe(85);
		expect(fetchMock).toHaveBeenCalledTimes(3);

		vi.useRealTimers();
	});

	it("throws the last error after exhausting retries on persistent 500s", async () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0);

		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({ ok: false, status: 500, text: async () => "server error" }),
			() => ({ ok: false, status: 500, text: async () => "server error" }),
			() => ({ ok: false, status: 500, text: async () => "server error" }),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const promise = provider.analyze(INPUT);
		// Swallow rejection during timer advancement to prevent unhandled rejection
		promise.catch(() => {});
		await vi.advanceTimersByTimeAsync(3000);

		await expect(promise).rejects.toThrow(/OpenAI API status 500/);
		expect(fetchMock).toHaveBeenCalledTimes(3);

		vi.useRealTimers();
	});

	it("throws when the response has no choices", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({ choices: [] }),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		await expect(provider.analyze(INPUT)).rejects.toThrow("Empty response from OpenAI");
	});

	it("falls back to default traits when JSON is malformed", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [{ message: { content: "```json\nnot valid\n```" } }],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const result = await provider.analyze(INPUT);
		expect(result.scores).toEqual({ overall: 70, body: 65, style: 70, color: 68 });
		expect(result.traits.bodyShape).toBe("rectangle");
		expect(result.traits.skinTone).toBe("neutral");
		expect(result.traits.faceShape).toBe("oval");
		expect(result.traits.styleType).toBe("casual");
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it("extracts JSON from markdown-wrapped responses", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [{ message: { content: `\`\`\`json\n${VALID_JSON_CONTENT}\n\`\`\`` } }],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const result = await provider.analyze(INPUT);
		expect(result.scores.overall).toBe(85);
	});

	it("clamps and sanitizes invalid scores and traits", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [
						{
							message: {
								content: JSON.stringify({
									scores: { overall: 200, body: -10, style: "NaN", color: "not a number" },
									traits: {
										bodyShape: "invalid_shape",
										skinTone: "neon",
										faceShape: "hexagon",
										styleType: "cyberpunk",
									},
								}),
							},
						},
					],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const result = await provider.analyze(INPUT);
		expect(result.scores).toEqual({
			overall: 70,
			body: 65,
			style: 70,
			color: 68,
		});
		expect(result.traits.bodyShape).toBe("rectangle");
		expect(result.traits.skinTone).toBe("neutral");
		expect(result.traits.faceShape).toBe("oval");
		expect(result.traits.styleType).toBe("casual");
	});

	it("truncates recommendations to max 5 and filters non-strings", async () => {
		vi.stubEnv("OPENAI_API_KEY", "sk-test");
		const fetchMock = mockFetchResponse([
			() => ({
				ok: true,
				status: 200,
				json: async () => ({
					choices: [
						{
							message: {
								content: JSON.stringify({
									recommendations: ["a", "b", 123, "c", "d", "e", "f", null, undefined],
								}),
							},
						},
					],
				}),
			}),
		]);
		vi.stubGlobal("fetch", fetchMock);

		const result = await provider.analyze(INPUT);
		expect(result.recommendations).toEqual(["a", "b", "c", "d", "e"]);
	});
});
