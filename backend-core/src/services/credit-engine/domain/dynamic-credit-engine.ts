/**
 * FinEra Dynamic Credit Engine — trust tiers, pricing, and risk labels (single source of truth).
 */

import type { AccountType } from "@prisma/client";

export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 100;
/** New users: canonical starting Trust Score. */
export const INITIAL_TRUST_SCORE = 50;

/** Student accounts: fixed credit facility cap (same currency unit as principal / wallets). */
export const STUDENT_CREDIT_LIMIT_USD = 30;

/** Max net positive trust change from events in a rolling UTC day (rapid-gain cap). */
export const DAILY_POSITIVE_TRUST_GAIN_CAP = 15;

export type TrustTierKey =
  | "blocked"
  | "recovery"
  | "starter"
  | "active_1"
  | "active_2"
  | "trusted"
  | "premium"
  | "elite";

export type ApiRiskStatus = "Low" | "Medium" | "High";

export interface TrustTierInfo {
  tierKey: TrustTierKey;
  scoreMin: number;
  scoreMax: number;
  /** Inclusive loan cap range for the tier (same numeric unit as wallet / principal). */
  limitMin: number;
  limitMax: number;
  blocked: boolean;
  apiRiskStatus: ApiRiskStatus;
}

const TIERS: TrustTierInfo[] = [
  { tierKey: "blocked", scoreMin: 0, scoreMax: 19, limitMin: 0, limitMax: 0, blocked: true, apiRiskStatus: "High" },
  { tierKey: "recovery", scoreMin: 20, scoreMax: 34, limitMin: 5, limitMax: 10, blocked: false, apiRiskStatus: "High" },
  { tierKey: "starter", scoreMin: 35, scoreMax: 49, limitMin: 10, limitMax: 20, blocked: false, apiRiskStatus: "Medium" },
  { tierKey: "active_1", scoreMin: 50, scoreMax: 59, limitMin: 20, limitMax: 30, blocked: false, apiRiskStatus: "Medium" },
  { tierKey: "active_2", scoreMin: 60, scoreMax: 69, limitMin: 30, limitMax: 50, blocked: false, apiRiskStatus: "Medium" },
  { tierKey: "trusted", scoreMin: 70, scoreMax: 79, limitMin: 50, limitMax: 80, blocked: false, apiRiskStatus: "Low" },
  { tierKey: "premium", scoreMin: 80, scoreMax: 89, limitMin: 80, limitMax: 120, blocked: false, apiRiskStatus: "Low" },
  { tierKey: "elite", scoreMin: 90, scoreMax: 100, limitMin: 120, limitMax: 200, blocked: false, apiRiskStatus: "Low" },
];

export function clampTrustScore(value: number): number {
  if (!Number.isFinite(value)) return INITIAL_TRUST_SCORE;
  return Math.min(TRUST_SCORE_MAX, Math.max(TRUST_SCORE_MIN, Math.round(value)));
}

export function getTrustTierInfo(trustScore: number): TrustTierInfo {
  const s = clampTrustScore(trustScore);
  const tier = TIERS.find((t) => s >= t.scoreMin && s <= t.scoreMax) ?? TIERS[0];
  return tier;
}

/**
 * Credit limit from trust tier. **STUDENT** accounts use a fixed {@link STUDENT_CREDIT_LIMIT_USD}
 * when not blocked (trust &lt; 20 → $0). Staff/alumni use tier interpolation.
 */
export function creditLimitForTrustScore(trustScore: number, accountType?: AccountType): number {
  const s = clampTrustScore(trustScore);
  const tier = getTrustTierInfo(s);
  if (tier.blocked) return 0;
  if (accountType === "STUDENT") {
    return STUDENT_CREDIT_LIMIT_USD;
  }
  const span = tier.scoreMax - tier.scoreMin || 1;
  const pos = (s - tier.scoreMin) / span;
  const raw = tier.limitMin + (tier.limitMax - tier.limitMin) * pos;
  return Math.round(raw * 100) / 100;
}

/** Global annual interest rate percent for all products (loan creation). */
export function globalAnnualInterestRatePercent(): number {
  return 15;
}

function envNum(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Processing fee charged at disbursement (flat, same currency as principal). */
export function processingFeeForLoan(): number {
  const min = envNum("FINERA_PROCESSING_FEE_MIN", 1);
  const max = envNum("FINERA_PROCESSING_FEE_MAX", 2);
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.round(((lo + hi) / 2) * 100) / 100;
}

/** Late fee as decimal fraction of outstanding principal (e.g. 0.075 = 7.5%). */
export function lateFeeRateFraction(): number {
  const minPct = envNum("FINERA_LATE_FEE_MIN_PCT", 5);
  const maxPct = envNum("FINERA_LATE_FEE_MAX_PCT", 10);
  const mid = (Math.min(minPct, maxPct) + Math.max(minPct, maxPct)) / 2;
  return mid / 100;
}

export function trustBelowLoanFloor(trustScore: number): boolean {
  return clampTrustScore(trustScore) < 20;
}
