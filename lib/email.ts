/**
 * Transactional email sending.
 *
 * Only password-reset emails are sent today. Delivery uses the Resend REST
 * API (no SDK dependency) when `RESEND_API_KEY` is set. Without a provider,
 * development builds log the reset link to the server console so the flow can
 * be exercised locally; production builds never emit a reset token to logs.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Suitora <no-reply@suitora.app>";

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** True when the current runtime is not a production deployment. */
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

function buildResetEmail(to: string, url: string) {
  return {
    to,
    subject: "Reset your Suitora password",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">Reset your password</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #555;">
          We received a request to reset the password for your Suitora account.
          The link below expires in one hour and can only be used once.
        </p>
        <a href="${url}"
           style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 999px; font-size: 14px;">
          Reset password
        </a>
        <p style="font-size: 13px; line-height: 1.6; color: #888;">
          If you didn't request this, you can safely ignore this email — your
          password won't change unless you use the link above.
        </p>
      </div>
    `,
  };
}

async function sendViaResend(to: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      ...buildResetEmail(to, url),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${detail}`);
  }
}

/**
 * Send a password-reset email. In development without an email provider the
 * reset link is logged to the console instead of emailed; in production a
 * missing provider is a hard error so operators notice it immediately.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (isResendConfigured()) {
    await sendViaResend(to, resetUrl);
    return;
  }

  if (isDevelopment()) {
    console.log(
      `[email] No email provider configured. Password reset link for ${to}:\n${resetUrl}`
    );
    return;
  }

  throw new Error(
    "No email provider configured (set RESEND_API_KEY to enable password resets)."
  );
}
