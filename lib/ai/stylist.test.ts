import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildSystemPrompt,
  generateStylistReply,
  resolveStylistProvider,
  type StylistContext,
} from "./stylist";

const BASE_CONTEXT: StylistContext = {
  name: "Alex",
  bodyShape: "hourglass",
  skinTone: "neutral",
  styleTags: ["minimalist"],
  fitPreference: "regular",
  totalAnalyses: 0,
  averageScore: 0,
  favoriteCount: 0,
  recentScores: [],
};

const ENV_KEYS = [
  "STYLIST_PROVIDER",
  "NVIDIA_API_KEY",
  "NVIDIA_BASE_URL",
  "NVIDIA_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
] as const;

function withEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    if (values[key] !== undefined) process.env[key] = values[key];
    else delete process.env[key];
  }
}

describe("resolveStylistProvider", () => {
  afterEach(() => withEnv({}));

  it("defaults to mock when no keys are configured", () => {
    withEnv({});
    expect(resolveStylistProvider()).toBe("mock");
  });

  it("prefers NVIDIA over OpenAI in auto mode", () => {
    withEnv({ NVIDIA_API_KEY: "nv", OPENAI_API_KEY: "oa" });
    expect(resolveStylistProvider()).toBe("nvidia");
  });

  it("uses OpenAI when only OPENAI_API_KEY is set", () => {
    withEnv({ OPENAI_API_KEY: "oa" });
    expect(resolveStylistProvider()).toBe("openai");
  });

  it("honors an explicit STYLIST_PROVIDER override", () => {
    withEnv({ STYLIST_PROVIDER: "mock", NVIDIA_API_KEY: "nv" });
    expect(resolveStylistProvider()).toBe("mock");
    withEnv({ STYLIST_PROVIDER: "openai", NVIDIA_API_KEY: "nv" });
    expect(resolveStylistProvider()).toBe("openai");
  });
});

describe("buildSystemPrompt", () => {
  it("renders the user profile section", () => {
    const prompt = buildSystemPrompt(BASE_CONTEXT);
    expect(prompt).toContain("User profile:");
    expect(prompt).toContain("Body shape: hourglass");
    expect(prompt).toContain("Style preferences: minimalist");
    expect(prompt).toContain("Name: Alex");
  });

  it("renders the analytics section from richer context", () => {
    const prompt = buildSystemPrompt({
      ...BASE_CONTEXT,
      totalAnalyses: 8,
      averageScore: 72,
      categoryBreakdown: [
        { category: "dresses", averageScore: 81, count: 4 },
        { category: "tops", averageScore: 74, count: 3 },
        { category: "bottoms", averageScore: 60, count: 1 },
      ],
      scoreTrend: { direction: "improving", recentAverage: 78, earlierAverage: 66 },
      recentItems: [
        { category: "dresses", subtype: "midi_wrap_dress", score: 85 },
        { category: "tops", score: 70 },
      ],
      wardrobeTags: ["neutral", "workwear"],
      topStyleTypes: ["minimalist", "casual"],
      preferredColors: ["warm neutrals"],
      avoidColors: ["neon"],
      bestCategory: "dresses",
      worstCategory: "bottoms",
    });
    expect(prompt).toContain("Analytics:");
    expect(prompt).toContain("Score trend: improving");
    expect(prompt).toContain("dresses (avg 81, 4 items)");
    expect(prompt).toContain("dresses (midi_wrap_dress) (85)");
    expect(prompt).toContain("Wardrobe staples: neutral, workwear");
    expect(prompt).toContain("Dominant style: minimalist, casual");
    expect(prompt).toContain("Color leanings: prefers warm neutrals; avoids neon");
  });

  it("omits the analytics section when nothing is available", () => {
    const prompt = buildSystemPrompt(BASE_CONTEXT);
    expect(prompt).not.toContain("Analytics:");
  });
});

describe("generateStylistReply", () => {
  beforeEach(() => withEnv({}));
  afterEach(() => withEnv({}));

  it("returns a rule-based reply when no provider is configured", async () => {
    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What should I wear?" }],
      context: BASE_CONTEXT,
    });
    expect(reply.length).toBeGreaterThan(0);
  });

  it("calls the NVIDIA endpoint when NVIDIA_API_KEY is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "  Try a wrap dress.  " } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ NVIDIA_API_KEY: "nv-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What suits me?" }],
      context: BASE_CONTEXT,
    });

    expect(reply).toBe("Try a wrap dress.");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: "Bearer nv-key" });
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("meta/llama-3.3-70b-instruct");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Suitora's AI fashion stylist");
    vi.unstubAllGlobals();
  });

  it("falls back to a rule-based reply when the provider errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ NVIDIA_API_KEY: "nv-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "hello" }],
      context: { ...BASE_CONTEXT, name: "Alex", totalAnalyses: 2 },
    });

    expect(reply.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});
