/**
 * FinEra - global field rules (types, patterns, normalizers).
 * Enforced at API boundary before any database write.
 */

import type { LoanStatus } from "@prisma/client";

/** Person names: ASCII letters and spaces only (no digits or symbols). */
export const PERSON_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

/** City / locality names: letters, spaces, hyphen, apostrophe (no digits). */
export const CITY_NAME_REGEX = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;

/** ISO 3166-1 alpha-2 country code (letters only). */
export const COUNTRY_CODE_REGEX = /^[A-Za-z]{2}$/;

const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

export const DEFAULT_TRUST_SCORE = 49;

export function isValidPersonName(value: string): boolean {
  const t = value.trim();
  if (t.length < 2) return false;
  return PERSON_NAME_REGEX.test(t);
}

export function toTitleCaseWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

/** Normalize city labels (hyphenated segments, spaces). */
export function formatCityName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word
        .split("-")
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1).toLowerCase() : ""))
        .join("-");
    })
    .join(" ");
}

/**
 * Normalize phone: keep leading + if present, require 10–15 digits total.
 * Returns E.164-style string or null if invalid.
 */
export function normalizePhone(input: string): { e164: string; digits: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < PHONE_DIGITS_MIN || digits.length > PHONE_DIGITS_MAX) return null;
  return { e164: `+${digits}`, digits };
}

/** Spec: loan_amount &lt; 100 → 25%, otherwise 15% (annual rate percent for product rules). */
export function assignLoanInterestRatePercent(principalAmount: number): number {
  if (!Number.isFinite(principalAmount) || principalAmount <= 0) {
    throw new Error("principalAmount must be a positive finite number");
  }
  return principalAmount < 100 ? 25 : 15;
}

/** Maps API-style status labels to Prisma LoanStatus (e.g. repaid → COMPLETED). */
export const LOAN_STATUS_API_TO_PRISMA: Record<string, LoanStatus> = {
  pending: "PENDING",
  approved: "APPROVED",
  repaid: "COMPLETED",
  defaulted: "DEFAULTED",
};

export function parseLoanStatusFromApi(value: string): LoanStatus | null {
  const k = value.trim().toLowerCase();
  return LOAN_STATUS_API_TO_PRISMA[k] ?? null;
}
