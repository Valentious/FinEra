/**
 * FinEra Backend - Constants
 */

/** Country groups for credit limit calculation */
export const COUNTRY_GROUPS = {
  DEVELOPED: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "SG"],
  AFRICA_MAJOR: ["ZA", "NG", "KE"],
  AFRICA_OTHER: ["ZW", "GH", "TZ", "UG", "ZM", "BW", "MZ", "ET", "RW", "EG", "MA", "TN"],
  ASIA_DEVELOPED: ["JP", "KR", "SG", "TW"],
  ASIA_DEVELOPING: ["IN", "ID", "PH", "VN", "TH"],
  SOUTH_AMERICA: ["BR", "AR", "CL", "CO", "PE", "MX"],
} as const;

/** Base credit limits by account type and region (USD equivalent) */
export const CREDIT_LIMITS = {
  STUDENT: {
    DEVELOPED: { min: 500, max: 2000 },
    AFRICA_MAJOR: { min: 50, max: 300 },
    AFRICA_OTHER: { min: 20, max: 150 },
    ASIA_DEVELOPED: { min: 300, max: 1000 },
    ASIA_DEVELOPING: { min: 50, max: 300 },
    SOUTH_AMERICA: { min: 50, max: 400 },
  },
  STAFF: {
    DEVELOPED: { min: 2000, max: 10000 },
    AFRICA_MAJOR: { min: 500, max: 3000 },
    AFRICA_OTHER: { min: 200, max: 1000 },
    ASIA_DEVELOPED: { min: 1000, max: 5000 },
    ASIA_DEVELOPING: { min: 300, max: 2000 },
    SOUTH_AMERICA: { min: 300, max: 2500 },
  },
  ALUMNI: {
    DEVELOPED: { min: 2000, max: 10000 },
    AFRICA_MAJOR: { min: 500, max: 3000 },
    AFRICA_OTHER: { min: 200, max: 1000 },
    ASIA_DEVELOPED: { min: 1000, max: 5000 },
    ASIA_DEVELOPING: { min: 300, max: 2000 },
    SOUTH_AMERICA: { min: 300, max: 2500 },
  },
} as const;

/** Account type multipliers */
export const ACCOUNT_TYPE_MULTIPLIERS = {
  STUDENT: 1.0,
  STAFF: 1.5,
  ALUMNI: 1.3,
} as const;

/** Base interest rates by currency (APR %) */
export const BASE_INTEREST_RATES = {
  USD: { min: 5, max: 15 },
  EUR: { min: 4, max: 12 },
  ZAR: { min: 8, max: 20 },
  ZIG: { min: 15, max: 30 },
} as const;

/** Risk adjustment by score range */
export const RISK_ADJUSTMENTS = {
  "80-100": -2,
  "60-79": 0,
  "40-59": 3,
  "0-39": 5,
} as const;
