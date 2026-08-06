import { describe, it, expect, vi, afterEach } from "vitest";
import { sendPasswordResetEmail } from "./email";

const RESET_URL = "https://suitora.app/reset-password/abc123?callbackURL=%2Freset-password";

describe("sendPasswordResetEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the reset email via Resend when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_secret");
    vi.stubEnv("NODE_ENV", "production");

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendPasswordResetEmail("user@example.com", RESET_URL);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_secret");

    const body = JSON.parse(init.body);
    expect(body.to).toBe("user@example.com");
    expect(body.subject.toLowerCase()).toContain("reset");
    expect(body.html).toContain(RESET_URL);
  });

  it("throws when Resend returns a non-2xx response", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" })
    );

    await expect(
      sendPasswordResetEmail("user@example.com", RESET_URL)
    ).rejects.toThrow(/Resend API error: 401/);
  });

  it("logs the reset link to the console in development without a provider", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendPasswordResetEmail("user@example.com", RESET_URL);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0].join(" ")).toContain(RESET_URL);
  });

  it("throws in production without a provider and never logs the reset link", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      sendPasswordResetEmail("user@example.com", RESET_URL)
    ).rejects.toThrow(/No email provider configured/);

    expect(logSpy).not.toHaveBeenCalled();
  });
});
