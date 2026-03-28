/**
 * Transactional OTP email delivery — Resend, SendGrid, or Amazon SES.
 * Retries, structured logs, no secrets in log output.
 */

import { logger } from "../../core/utils/logger.js";

export type EmailProviderName = "resend" | "sendgrid" | "ses" | "none";

function maskEmailForLog(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "[invalid]";
  const safe = local.length <= 2 ? `${local[0] ?? ""}***` : `${local.slice(0, 2)}***`;
  return `${safe}@${domain}`;
}

function buildOtpHtml(code: string): string {
  return `<p>Your FinEra verification code is <strong style="font-size:18px;letter-spacing:2px">${code}</strong>.</p>
<p>This code expires in 10 minutes.</p>
<p>If you did not request this, you can ignore this email.</p>`;
}

function buildOtpText(code: string): string {
  return `Your FinEra verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`;
}

/** Detect which provider to use (explicit EMAIL_PROVIDER or auto from env). */
export function resolveEmailProvider(): EmailProviderName {
  const explicit = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (explicit === "resend" || explicit === "sendgrid" || explicit === "ses" || explicit === "none") {
    return explicit;
  }
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return "ses";
  }
  return "none";
}

function getFromAddress(): { email: string; name?: string } {
  const raw = process.env.EMAIL_FROM || "FinEra <noreply@example.invalid>";
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) {
    return { name: m[1].trim(), email: m[2].trim() };
  }
  return { email: raw.trim() };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
  delaysMs: number[] = [400, 1200, 2800]
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      logger.warn(
        { attempt: i + 1, attempts, err: err instanceof Error ? err.message : String(err) },
        `${label} attempt failed`
      );
      if (i < attempts - 1) {
        await sleep(delaysMs[i] ?? delaysMs[delaysMs.length - 1]);
      }
    }
  }
  throw lastErr;
}

async function sendViaResend(to: string, code: string): Promise<{ providerMessageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY missing");

  const from = process.env.EMAIL_FROM || "FinEra <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your FinEra verification code",
      html: buildOtpHtml(code),
      text: buildOtpText(code),
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    logger.error({ status: res.status, body: bodyText.slice(0, 500) }, "Resend API error response");
    throw new Error(`Resend HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
  }

  let providerMessageId: string | undefined;
  try {
    const json = JSON.parse(bodyText) as { id?: string };
    providerMessageId = json.id;
  } catch {
    /* ignore */
  }

  logger.info(
    { provider: "resend" as const, to: maskEmailForLog(to), providerMessageId, status: res.status },
    "Email provider accepted OTP send (Resend)"
  );
  return { providerMessageId };
}

async function sendViaSendGrid(to: string, code: string): Promise<{ providerMessageId?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY missing");

  const from = getFromAddress();
  const sandboxEnabled = process.env.SENDGRID_SANDBOX_MODE === "true";

  if (sandboxEnabled) {
    logger.warn(
      {},
      "SendGrid sandbox mode is ON — emails will NOT be delivered to real inboxes. Set SENDGRID_SANDBOX_MODE=false for production."
    );
  }

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from.email, name: from.name || "FinEra" },
    subject: "Your FinEra verification code",
    content: [
      { type: "text/plain", value: buildOtpText(code) },
      { type: "text/html", value: buildOtpHtml(code) },
    ],
    mail_settings: {
      sandbox_mode: { enable: sandboxEnabled },
    },
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const messageId = res.headers.get("x-message-id") || undefined;

  if (!res.ok) {
    const errBody = await res.text();
    logger.error(
      { status: res.status, body: errBody.slice(0, 500), sandbox: sandboxEnabled },
      "SendGrid API error response"
    );
    throw new Error(`SendGrid HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }

  logger.info(
    {
      provider: "sendgrid" as const,
      to: maskEmailForLog(to),
      providerMessageId: messageId,
      status: res.status,
      sandbox: sandboxEnabled,
    },
    "Email provider accepted OTP send (SendGrid)"
  );
  return { providerMessageId: messageId };
}

async function sendViaSes(to: string, code: string): Promise<{ providerMessageId?: string }> {
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION;
  if (!region) throw new Error("AWS_SES_REGION or AWS_REGION required for SES");

  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
  const from = getFromAddress();

  const client = new SESClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const out = await client.send(
    new SendEmailCommand({
      Source: from.name ? `${from.name} <${from.email}>` : from.email,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: "Your FinEra verification code", Charset: "UTF-8" },
        Body: {
          Text: { Data: buildOtpText(code), Charset: "UTF-8" },
          Html: { Data: buildOtpHtml(code), Charset: "UTF-8" },
        },
      },
    })
  );

  const providerMessageId = out.MessageId;
  logger.info(
    { provider: "ses" as const, to: maskEmailForLog(to), providerMessageId, region },
    "Email provider accepted OTP send (Amazon SES)"
  );
  return { providerMessageId };
}

export interface SendOtpResult {
  ok: boolean;
  provider: EmailProviderName;
  providerMessageId?: string;
  /** True when no provider and dev fallback was used */
  devFallback?: boolean;
}

/**
 * Send OTP email. Throws on hard failure (production).
 * In development, may log OTP and return ok when delivery is unavailable (see caller).
 */
export async function sendOtpEmail(to: string, code: string): Promise<SendOtpResult> {
  const explicit = (process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  let provider = resolveEmailProvider();

  if (explicit === "resend") provider = "resend";
  else if (explicit === "sendgrid") provider = "sendgrid";
  else if (explicit === "ses") provider = "ses";

  if (provider === "none") {
    logger.warn({ to: maskEmailForLog(to) }, "No email provider configured (RESEND / SENDGRID / SES env)");
    return { ok: false, provider: "none" };
  }

  const run = async (): Promise<SendOtpResult> => {
    if (provider === "resend") {
      const r = await sendViaResend(to, code);
      return { ok: true, provider: "resend", providerMessageId: r.providerMessageId };
    }
    if (provider === "sendgrid") {
      const r = await sendViaSendGrid(to, code);
      return { ok: true, provider: "sendgrid", providerMessageId: r.providerMessageId };
    }
    if (provider === "ses") {
      const r = await sendViaSes(to, code);
      return { ok: true, provider: "ses", providerMessageId: r.providerMessageId };
    }
    return { ok: false, provider: "none" };
  };

  return withRetry("OTP email send", run, 3, [400, 1200, 2800]);
}

export function logDevOtpFallback(to: string, code: string, reason: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.EMAIL_DEV_LOG_OTP === "false") return;
  logger.warn(
    { to: maskEmailForLog(to), reason },
    `[DEV ONLY] OTP email not delivered — use this code to continue testing: ${code}`
  );
}

export { maskEmailForLog };
