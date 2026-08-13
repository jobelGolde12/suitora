import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildSystemPrompt,
  generateStylistReply,
  resetStylistProviderHealth,
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
  "GROQ_API_KEY",
  "GROQ_BASE_URL",
  "GROQ_MODEL",
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

function jsonResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

describe("resolveStylistProvider", () => {
  afterEach(() => withEnv({}));

  it("defaults to mock when no keys are configured", () => {
    withEnv({});
    expect(resolveStylistProvider()).toBe("mock");
  });

  it("prefers Groq over OpenAI and NVIDIA in auto mode", () => {
    withEnv({ GROQ_API_KEY: "g", OPENAI_API_KEY: "oa", NVIDIA_API_KEY: "nv" });
    expect(resolveStylistProvider()).toBe("groq");
  });

  it("uses OpenAI when only OPENAI_API_KEY is set", () => {
    withEnv({ OPENAI_API_KEY: "oa" });
    expect(resolveStylistProvider()).toBe("openai");
  });

  it("uses NVIDIA when only NVIDIA_API_KEY is set", () => {
    withEnv({ NVIDIA_API_KEY: "nv" });
    expect(resolveStylistProvider()).toBe("nvidia");
  });

  it("honors an explicit STYLIST_PROVIDER override", () => {
    withEnv({ STYLIST_PROVIDER: "mock", NVIDIA_API_KEY: "nv" });
    expect(resolveStylistProvider()).toBe("mock");
    withEnv({ STYLIST_PROVIDER: "openai", GROQ_API_KEY: "g" });
    expect(resolveStylistProvider()).toBe("openai");
    withEnv({ STYLIST_PROVIDER: "nvidia", GROQ_API_KEY: "g" });
    expect(resolveStylistProvider()).toBe("nvidia");
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
  beforeEach(() => {
    withEnv({});
    resetStylistProviderHealth();
  });
  afterEach(() => {
    withEnv({});
    resetStylistProviderHealth();
    vi.unstubAllGlobals();
  });

  it("returns a rule-based reply when no provider is configured", async () => {
    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What should I wear?" }],
      context: BASE_CONTEXT,
    });
    expect(reply.length).toBeGreaterThan(0);
  });

  it("calls the Groq endpoint when GROQ_API_KEY is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse("  Try a wrap dress.  "));
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What suits me?" }],
      context: BASE_CONTEXT,
    });

    expect(reply).toBe("Try a wrap dress.");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("api.groq.com");
    expect(init.headers).toMatchObject({ Authorization: "Bearer g-key" });
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("llama-3.3-70b-versatile");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("Suitora's AI fashion stylist");
  });

  it("races all configured providers and returns the first real reply", async () => {
    // NVIDIA and OpenAI hang (only reject when aborted); Groq answers fast —
    // the winner should be the Groq reply, proving parallel racing beats
    // sequential failover and that losers get aborted.
    const fetchMock = vi.fn(
      (url: string, init?: RequestInit) =>
        new Promise((resolve, reject) => {
          if (String(url).includes("groq.com")) {
            resolve(jsonResponse("  Groq is the fastest.  "));
            return;
          }
          // Hung providers reject only when the race aborts them.
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("This operation was aborted"))
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key", OPENAI_API_KEY: "oa-key", NVIDIA_API_KEY: "nv-key" });

    const started = Date.now();
    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What suits me?" }],
      context: BASE_CONTEXT,
    });
    const elapsed = Date.now() - started;

    expect(reply).toBe("Groq is the fastest.");
    expect(elapsed).toBeLessThan(3_000);
    expect(fetchMock).toHaveBeenCalledTimes(3); // groq + openai + nvidia raced
  });

  it("falls back to a rule-based reply when the provider errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "hello" }],
      context: { ...BASE_CONTEXT, name: "Alex", totalAnalyses: 2 },
    });

    expect(reply.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails over to OpenAI when Groq errors and OpenAI answers", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (String(url).includes("openai.com")) {
        return Promise.resolve(jsonResponse("  A real OpenAI reply.  "));
      }
      return Promise.resolve({ ok: false, status: 400, text: async () => "bad request" });
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key", OPENAI_API_KEY: "oa-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What suits me?" }],
      context: { ...BASE_CONTEXT, totalAnalyses: 8, averageScore: 72 },
    });

    expect(reply).toBe("A real OpenAI reply.");
    const openaiCall = fetchMock.mock.calls.find(([u]) =>
      String(u).includes("openai.com")
    ) as unknown as [string, RequestInit];
    expect(openaiCall).toBeTruthy();
    const body = JSON.parse(String(openaiCall[1].body));
    // The provider prompt carries the user's analytics data, not a canned prompt.
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("8 analyses so far");
    expect(body.messages[0].content).toContain("Average score: 72");
    expect(body.messages[1].content).toBe("What suits me?");
  });

  it("falls back to the rule-based reply when every provider fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key", OPENAI_API_KEY: "oa-key" });

    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "What should I wear?" }],
      context: { ...BASE_CONTEXT, totalAnalyses: 3 },
    });

    expect(reply.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2); // groq + openai, no mock fetch
  });

  it("skips a provider that is in cooldown after failing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key" });

    // First call: Groq fails and goes into cooldown.
    await generateStylistReply({
      messages: [{ role: "user", content: "hello" }],
      context: BASE_CONTEXT,
    });

    // Second call: Groq is in cooldown, so no provider is attempted at all.
    const reply = await generateStylistReply({
      messages: [{ role: "user", content: "hello again" }],
      context: BASE_CONTEXT,
    });

    expect(reply.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the first call hit fetch
  });

  it("tries a cooldown provider again after health reset", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });
    vi.stubGlobal("fetch", fetchMock);
    withEnv({ GROQ_API_KEY: "g-key" });

    await generateStylistReply({
      messages: [{ role: "user", content: "hello" }],
      context: BASE_CONTEXT,
    });
    resetStylistProviderHealth();

    await generateStylistReply({
      messages: [{ role: "user", content: "hello again" }],
      context: BASE_CONTEXT,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
