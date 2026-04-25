import type { UserData } from "@/services/api";

/** Matches backend / Dynamic Credit Engine default trust for capped legacy clients. */
export const MEMBER_TRUST_SCORE_CAP = 50;
export const STUDENT_STORED_CREDIT_CAP = 30;
/** Legacy mock default for staff/alumni before product cap was raised to $5,000. */
const LEGACY_STAFF_ALUMNI_CREDIT_CAP = 2000;
export const STAFF_ALUMNI_CREDIT_CAP = 5000;

/** Fix persisted member JSON (localStorage) from older builds (e.g. 75 TrustScore, $200 student cap). */
export function normalizeStoredMemberTrust(user: UserData): { user: UserData; changed: boolean } {
  let changed = false;
  let next = user;
  if (typeof user.disciplineScore === "number" && user.disciplineScore > MEMBER_TRUST_SCORE_CAP) {
    next = { ...next, disciplineScore: MEMBER_TRUST_SCORE_CAP };
    changed = true;
  }
  if (
    user.accountType === "student" &&
    typeof user.availableCreditLimit === "number" &&
    user.availableCreditLimit > STUDENT_STORED_CREDIT_CAP
  ) {
    next = { ...next, availableCreditLimit: STUDENT_STORED_CREDIT_CAP };
    changed = true;
  }
  if (
    (user.accountType === "staff" || user.accountType === "alumni") &&
    user.availableCreditLimit === LEGACY_STAFF_ALUMNI_CREDIT_CAP
  ) {
    next = { ...next, availableCreditLimit: STAFF_ALUMNI_CREDIT_CAP };
    changed = true;
  }
  return { user: next, changed };
}
