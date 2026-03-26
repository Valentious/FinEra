/**
 * In-memory rate limits for registration OTP send/resend (per server instance).
 * Cooldown uses DB `emailOtpLastSentAt`; hourly cap uses this map.
 */

import { validationError } from "../../middlewares/errorHandler.js";

const MAX_SENDS_PER_HOUR = 10;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;

const hourlySendTimestamps = new Map<string, number[]>();

function pruneHourly(email: string): number[] {
  const now = Date.now();
  let arr = hourlySendTimestamps.get(email) ?? [];
  arr = arr.filter((t) => now - t < HOURLY_WINDOW_MS);
  hourlySendTimestamps.set(email, arr);
  return arr;
}

export function recordOtpSend(email: string): void {
  const arr = pruneHourly(email);
  arr.push(Date.now());
  hourlySendTimestamps.set(email, arr);
}

export function assertHourlyOtpLimit(email: string): void {
  const hourly = pruneHourly(email);
  if (hourly.length >= MAX_SENDS_PER_HOUR) {
    throw validationError("Too many verification emails requested. Try again in about an hour.");
  }
}
