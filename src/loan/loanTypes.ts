/**
 * Role-based loan products. Chosen before amount entry (dashboard).
 */
export const LOAN_TYPES = [
  "ASSET_BACKED",
  "SALARY_BACKED",
  "COLLATERAL",
  "NON_COLLATERAL",
] as const;

export type LoanType = (typeof LOAN_TYPES)[number];

export type AppAccountType = "student" | "staff" | "alumni";

/** Map UI account to API/backend account enum (alumni = business representative). */
export function toBackendAccountType(accountType: AppAccountType): "STUDENT" | "STAFF" | "ALUMNI" {
  return accountType === "student" ? "STUDENT" : accountType === "staff" ? "STAFF" : "ALUMNI";
}

/** Staff: asset + salary. Sole trader (alumni): asset only. Student: non-collateral only. */
export function isLoanTypeAllowedForAccount(loanType: LoanType, accountType: AppAccountType): boolean {
  if (accountType === "student") {
    return loanType === "NON_COLLATERAL";
  }
  if (accountType === "alumni") {
    return loanType === "ASSET_BACKED";
  }
  return loanType === "ASSET_BACKED" || loanType === "SALARY_BACKED";
}

/** When stored loanType is not allowed, snap back to a safe default. */
export function getDefaultLoanTypeForAccount(accountType: AppAccountType): LoanType {
  if (accountType === "student") return "NON_COLLATERAL";
  return "ASSET_BACKED";
}

export function requiresCollateralStep(loanType: LoanType): boolean {
  return loanType === "ASSET_BACKED" || loanType === "COLLATERAL";
}

/**
 * FinCash 20% discipline rule applies only to unsecured student non-collateral (essential/business).
 */
export function requiresWalletDisciplineForAmount(
  loanType: LoanType,
  creditType: string
): boolean {
  return loanType === "NON_COLLATERAL" && (creditType === "essential" || creditType === "business");
}

export function getLoanProductLabel(loanType: LoanType): string {
  switch (loanType) {
    case "ASSET_BACKED":
      return "Asset-Based Loan";
    case "SALARY_BACKED":
      return "Salary-Based Loan";
    case "COLLATERAL":
      return "Collateral Loan";
    case "NON_COLLATERAL":
      return "Student Portal Based Loan";
    default:
      return "Loan";
  }
}

export function getLoanProductShortDescription(loanType: LoanType): string {
  switch (loanType) {
    case "ASSET_BACKED":
      return "Secured by verified assets and valuation.";
    case "SALARY_BACKED":
      return "Salary-based capacity and automated scoring.";
    case "COLLATERAL":
      return "Secured with pledged collateral.";
    case "NON_COLLATERAL":
      return "No pledged asset.";
    default:
      return "";
  }
}
