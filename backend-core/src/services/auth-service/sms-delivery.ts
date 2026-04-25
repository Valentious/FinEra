/**
 * Optional Twilio SMS for password reset OTP and registration phone verification.
 * Configure: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (E.164).
 */

import { logger } from "../../core/utils/logger.js";

function maskPhone(phone: string): string {
  const t = phone.replace(/\s/g, "");
  if (t.length < 6) return "***";
  return `${t.slice(0, 3)}…${t.slice(-2)}`;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

/** Send SMS; throws on HTTP/provider failure. */
export async function sendPasswordResetSms(toE164: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured");
  }

  const body = new URLSearchParams({
    To: toE164,
    From: from,
    Body: `FinEra password reset code: ${code}. Expires in 10 minutes. If you did not request this, ignore this message.`,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error({ status: res.status, body: text.slice(0, 400), to: maskPhone(toE164) }, "Twilio SMS send failed");
    throw new Error(`Twilio HTTP ${res.status}`);
  }

  logger.info({ to: maskPhone(toE164) }, "Password reset SMS accepted by Twilio");
}

/** SMS body for sign-up phone confirmation (same Twilio path as password reset). */
export async function sendRegistrationOtpSms(toE164: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured");
  }

  const body = new URLSearchParams({
    To: toE164,
    From: from,
    Body: `FinEra sign-up: your phone verification code is ${code}. Expires in 10 minutes. If you did not register, ignore this message.`,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error({ status: res.status, body: text.slice(0, 400), to: maskPhone(toE164) }, "Twilio registration SMS send failed");
    throw new Error(`Twilio HTTP ${res.status}`);
  }

  logger.info({ to: maskPhone(toE164) }, "Registration phone SMS accepted by Twilio");
}

/**
 * Send registration phone OTP. If Twilio is not configured, logs the code in development only.
 */
export async function deliverRegistrationPhoneOtp(toE164: string, code: string): Promise<void> {
  if (isTwilioConfigured()) {
    await sendRegistrationOtpSms(toE164, code);
    return;
  }
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    logger.info(
      { to: maskPhone(toE164) },
      `FinEra registration phone OTP (Twilio not configured): ${code}`
    );
    return;
  }
  logger.warn({ to: maskPhone(toE164) }, "Registration phone OTP not sent: Twilio not configured in production");
}
