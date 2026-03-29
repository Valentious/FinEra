/**
 * API Service Layer
 * 
 * This file contains all backend API calls.
 * Replace the placeholder BASE_URL with your actual backend URL.
 * 
 * Backend developers should implement these endpoints:
 * - Authentication & User Management
 * - Transactions & Wallet Operations
 * - Credit Application & Approval
 * - Repayment Processing
 * - Financial Metrics Calculation
 */

import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { getWalletLabel } from "@/types/wallet";

/** API base URL - use full URL in dev (backend on different port than frontend) */
export const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string) || "http://localhost:4000/api/v1";

const BASE_URL = API_BASE_URL;

/** Base URL for health checks (without /api/v1) */
export const HEALTH_URL =
  (BASE_URL.replace(/\/api\/v1\/?$/, "") || "http://localhost:4000") + "/health";

/**
 * Check if backend is available. Uses retry for resilience.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { method: "GET", credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

// ==================== TYPES ====================

export interface FinEraAccountNumbers {
  usd: string;
  zig: string;
  zar: string;
}

export interface BankLinkingData {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch?: string;
}

export interface UserData {
  memberId: string;
  fullName: string;
  title?: string;
  /** ISO 8601 calendar date YYYY-MM-DD — sensitive PII */
  dateOfBirth?: string;
  /** When true, DOB cannot be changed in profile (support/admin only). */
  dateOfBirthLocked?: boolean;
  phoneNumber: string;
  accountNumber: string;
  nationalIdNumber: string;
  studentStaffId: string;
  salaryRange?: string | null;
  email: string;
  mobile: string;
  accountType: 'student' | 'staff' | 'alumni';
  walletBalance: number;
  approvedCreditWallet: number;
  activeCredit: number;
  availableCreditLimit: number;
  loanPrincipal: number;
  transactions: Transaction[];
  lastLogin?: number;
  disciplineScore: number;
  creditScore: number;
  loyaltyProgress: number;
  missedPayments: number;
  onTimePayments: number;
  /** Multi-currency FinEra account numbers (FE-USD-xxx, FE-ZIG-xxx, FE-ZAR-xxx) */
  finEraAccountNumbers?: FinEraAccountNumbers;
  /** Bank linking data (Staff & Alumni only) */
  bankLinkingData?: BankLinkingData;
  /** User's country (from profile) - used for payment options */
  countryId?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'loan' | 'repayment';
  amount: number;
  date: string;
  description: string;
  status?: 'pending' | 'completed' | 'failed';
  /** Ledger currency — required for strict multi-currency isolation */
  currency?: string;
}

export interface CreditApplication {
  creditType: 'essential' | 'emergency' | 'business';
  amount: number;
  withCollateral: boolean;
  collateralDetails?: any;
  /** Currency for the credit (wallet isolation) - required for correct wallet targeting */
  currency?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  dateOfBirth: string; // ISO YYYY-MM-DD, min age 18
  phoneNumber: string;
  email: string;
  password: string;
  accountType: 'student' | 'staff' | 'alumni';
  /** Country 2-letter ISO code (e.g. ZW) - from reference data */
  country?: string;
  /** City name - from reference data */
  city?: string;
  /** Institution name - from reference data */
  institution?: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface DepositRequest {
  amount: number;
  method: string;
  purpose: string;
  currency?: string;
}

export interface WithdrawalRequest {
  amount: number;
  method: string;
  destination?: string;
  currency?: string;
}

export interface RepaymentRequest {
  amount: number;
  method: string;
  currency?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ==================== HELPER FUNCTIONS ====================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message;
      const isRetryable =
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed") ||
        (error instanceof TypeError && msg.toLowerCase().includes("fetch"));
      if (!isRetryable || attempt === retries - 1) {
        if (isRetryable) {
          throw new Error("Unable to connect. Please check your connection.");
        }
        throw lastError;
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("Request failed");
}

// ==================== AUTHENTICATION APIs ====================

/**
 * POST /auth/register
 * Register a new user
 * Backend should:
 * - Validate input
 * - Generate memberId (e.g., MEM12345678)
 * - Generate accountNumber (12-digit unique number)
 * - Calculate initial creditLimit based on accountType
 * - Hash password
 * - Send OTP to email/phone
 * - Return user object
 */
export async function register(data: RegisterRequest): Promise<{ user: UserData; message: string }> {
  const res = await apiCall<{ success: boolean; data: { userId: string; email: string }; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      accountType: data.accountType.toUpperCase(),
      country: data.country || 'ZW',
      city: data.city || '',
      institution: data.institution || '',
      dateOfBirth: data.dateOfBirth,
      phoneNumber: data.phoneNumber,
    }),
  });
  return {
    user: {
      memberId: res.data?.userId || '',
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      phoneNumber: data.phoneNumber,
      accountNumber: '',
      nationalIdNumber: '',
      studentStaffId: '',
      salaryRange: null,
      email: data.email,
      mobile: data.phoneNumber,
      accountType: data.accountType,
      walletBalance: 0,
      approvedCreditWallet: 0,
      activeCredit: 0,
      availableCreditLimit: 200,
      loanPrincipal: 0,
      transactions: [],
      disciplineScore: 50,
      creditScore: 82,
      loyaltyProgress: 0,
      missedPayments: 0,
      onTimePayments: 0,
    },
    message: res.message || 'Account created. Check your email for a verification code.',
  };
}

/**
 * POST /auth/verify-email — verifies registration OTP and returns JWTs (auto sign-in).
 */
export async function verifyRegistrationEmail(
  email: string,
  code: string
): Promise<{ user: UserData; token: string; message: string }> {
  const res = await apiCall<{
    success: boolean;
    message?: string;
    data?: { accessToken: string; refreshToken: string; expiresIn: number };
  }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
  });
  if (res.data?.accessToken) {
    localStorage.setItem("auth_token", res.data.accessToken);
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken || "");
  }
  localStorage.setItem("active_user_email", email.trim().toLowerCase()); // must match App member_* keys
  const user = await getUserProfile();
  return {
    user,
    token: res.data?.accessToken || "",
    message: res.message || "Email verified.",
  };
}

/**
 * POST /auth/login
 * Login existing user
 * Backend should:
 * - Validate credentials
 * - Generate JWT token
 * - Update lastLogin timestamp
 * - Return user data and token
 */
export async function login(data: LoginRequest): Promise<{ user: UserData; token: string }> {
  const res = await apiCall<{ success: boolean; data: { accessToken: string; refreshToken: string; expiresIn: number } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.data?.accessToken) {
    localStorage.setItem('auth_token', res.data.accessToken);
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken || '');
  }
  const user = await getUserProfile();
  return { user, token: res.data?.accessToken || '' };
}

/**
 * POST /auth/verify-otp (legacy name — prefer verifyRegistrationEmail)
 */
export async function verifyOTP(data: OTPVerificationRequest): Promise<{ success: boolean; message: string }> {
  await verifyRegistrationEmail(data.email, data.otp);
  return { success: true, message: "Verified" };
}

/**
 * POST /auth/resend-otp — resend registration verification code
 */
export async function resendOTP(email: string): Promise<{ success: boolean; message: string }> {
  const res = await apiCall<{ success: boolean; message?: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  return { success: !!res.success, message: res.message || "Verification code sent." };
}

/**
 * POST /auth/logout
 * Logout user and invalidate token
 */
export async function logout(): Promise<{ success: boolean }> {
  const refreshToken = localStorage.getItem('refreshToken');
  return apiCall('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshToken || '' }),
  });
}

// ==================== REFERENCE DATA APIs ====================

export interface ReferenceCountry {
  id: string;
  name: string;
  code: string;
}

export interface ReferenceCity {
  id: string;
  name: string;
  countryId: string;
}

export interface ReferenceInstitution {
  id: string;
  name: string;
  type: string;
  cityId: string;
}

export interface RegistrationData {
  countries: ReferenceCountry[];
  cities: ReferenceCity[];
  institutions: ReferenceInstitution[];
}

const REGISTRATION_CACHE_KEY = "finera_registration_data";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Fetch all registration data with retry. Returns fallback on failure - never throws. */
export async function getRegistrationData(): Promise<RegistrationData> {
  const base = (import.meta.env?.VITE_API_URL as string) || "http://localhost:4000/api/v1";
  const url = `${base}/reference/registration-data`;

  try {
    const cached = localStorage.getItem(REGISTRATION_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached) as { data: RegistrationData; ts: number };
      if (Date.now() - ts < CACHE_TTL_MS && data?.countries?.length) {
        return data;
      }
    }
  } catch {
    /* ignore cache parse errors */
  }

  try {
    const data = await fetchWithRetry<{ countries?: unknown[]; cities?: unknown[]; institutions?: unknown[] }>(
      url,
      {},
      3
    );
    const countries = Array.isArray(data?.countries) ? data.countries : [];
    const cities = Array.isArray(data?.cities) ? data.cities : [];
    const institutions = Array.isArray(data?.institutions) ? data.institutions : [];

    if (countries.length > 0) {
      const result = { countries, cities, institutions } as RegistrationData;
      try {
        localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
      } catch {
        /* ignore */
      }
      return result;
    }
  } catch (err) {
    console.warn("Registration data API unavailable, using fallback:", err);
  }

  const { getFallbackRegistrationData } = await import("@/data/locations");
  return getFallbackRegistrationData() as RegistrationData;
}

export async function getCountries(): Promise<ReferenceCountry[]> {
  const res = await apiCall<ReferenceCountry[]>("/reference/countries");
  return Array.isArray(res) ? res : [];
}

export async function getCities(countryId?: string): Promise<ReferenceCity[]> {
  const url = countryId ? `/reference/cities?countryId=${encodeURIComponent(countryId)}` : "/reference/cities";
  const res = await apiCall<ReferenceCity[]>(url);
  return Array.isArray(res) ? res : [];
}

export async function getInstitutions(countryId?: string, type?: "student" | "staff" | "alumni"): Promise<ReferenceInstitution[]> {
  const params = new URLSearchParams();
  if (countryId) params.set("countryId", countryId);
  if (type) params.set("type", type);
  const url = `/reference/institutions${params.toString() ? "?" + params.toString() : ""}`;
  const res = await apiCall<ReferenceInstitution[]>(url);
  return Array.isArray(res) ? res : [];
}

// ==================== MULTI-CURRENCY DASHBOARD APIs ====================

export interface CurrencyConfig {
  currencyCode: string;
  displayName: string;
  symbol: string;
  status: string;
  custodyType: string;
  dashboardConfig: {
    minAmount?: number;
    maxAmount?: number;
    feePercent?: number;
    dailyLimit?: number;
    features?: string[];
  };
}

/** GET /currencies - Fetch active currencies for dynamic dashboard loading */
export async function getCurrencies(): Promise<CurrencyConfig[]> {
  try {
    const res = await apiCall<{ success: boolean; data: CurrencyConfig[] }>("/currencies");
    return res.data ?? [];
  } catch {
    return [
      { currencyCode: "USD", displayName: "US Dollar", symbol: "$", status: "active", custodyType: "bank", dashboardConfig: {} },
      { currencyCode: "ZIG", displayName: "Zimbabwe Gold (ZiG)", symbol: "Z$", status: "active", custodyType: "momo", dashboardConfig: {} },
      { currencyCode: "ZAR", displayName: "South African Rand", symbol: "R", status: "active", custodyType: "bank", dashboardConfig: {} },
    ];
  }
}

/** GET /dashboard-config - Full dashboard config per currency */
export async function getDashboardConfig(currency?: string): Promise<Record<string, object>> {
  try {
    const url = currency ? `/currencies/dashboard-config?currency=${encodeURIComponent(currency)}` : "/currencies/dashboard-config";
    const res = await apiCall<{ success: boolean; data: Record<string, object> }>(url);
    return res.data ?? {};
  } catch {
    return {};
  }
}

type WalletApiRow = {
  id: string;
  currencyCode: string;
  accountNumber: string;
  walletLabel?: string;
  savingsBalance?: string | number;
  balance?: string | number;
  approvedCreditBalance?: string | number;
  activeLoanBalance?: string | number;
  ledgerAccount?: {
    savingsBalance?: string | number;
    balance?: string | number;
    approvedCreditBalance?: string | number;
    activeLoanBalance?: string | number;
  };
};

function num(v: string | number | undefined | null): number {
  if (typeof v === "number") return v;
  return parseFloat(String(v ?? 0)) || 0;
}

/** Normalizes flat wallet payload or legacy nested ledgerAccount (per-currency isolation). */
function normalizeWalletRow(w: WalletApiRow): {
  id: string;
  currencyCode: string;
  accountNumber: string;
  balance: number;
  walletLabel: string;
  approvedCreditBalance: number;
  activeLoanBalance: number;
} {
  const la = w.ledgerAccount;
  const cc = w.currencyCode;
  const bal = num(la?.balance ?? w.balance ?? la?.savingsBalance ?? w.savingsBalance);
  return {
    id: w.id,
    currencyCode: cc,
    accountNumber: w.accountNumber,
    balance: bal,
    walletLabel: w.walletLabel ?? getWalletLabel(cc),
    approvedCreditBalance: num(la?.approvedCreditBalance ?? w.approvedCreditBalance),
    activeLoanBalance: num(la?.activeLoanBalance ?? w.activeLoanBalance),
  };
}

/** GET /user/wallets?currency=X - Wallets filtered by currency (per-dashboard) */
export async function getWalletsByCurrency(currency?: string): Promise<
  Array<{
    id: string;
    currencyCode: string;
    accountNumber: string;
    balance: number;
    walletLabel: string;
    approvedCreditBalance: number;
    activeLoanBalance: number;
  }>
> {
  const url = currency ? `/user/wallets?currency=${encodeURIComponent(currency)}` : "/user/wallets";
  const res = await apiCall<{ success: boolean; data: WalletApiRow[] }>(url);
  const list = res.data ?? [];
  return list.map(normalizeWalletRow);
}

function normalizeTxnStatus(s: string | undefined): Transaction["status"] {
  const v = (s ?? "").toLowerCase();
  if (v === "pending" || v === "failed") return v;
  return "completed";
}

/** GET /wallet/transactions?currency=X - Transactions filtered by currency (per-dashboard) */
export async function getTransactionsByCurrency(currency: string, params?: { page?: number; limit?: number }): Promise<Transaction[]> {
  const q = new URLSearchParams();
  q.set("currency", currency);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await apiCall<{
    success: boolean;
    data: {
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        date?: string;
        description?: string;
        currency?: string;
        status?: string;
        createdAt?: string;
      }>;
    };
  }>(`/wallet/transactions?${q}`);
  const list = res.data?.transactions ?? [];
  const mapType = (s: string): Transaction["type"] => {
    const t = (s || "").toLowerCase();
    if (t === "deposit" || t === "withdrawal" || t === "loan" || t === "repayment") return t as Transaction["type"];
    if (t === "loan_disbursement") return "loan";
    if (t === "loan_repayment") return "repayment";
    return t === "withdrawal" ? "withdrawal" : "deposit";
  };
  return list.map((t) => ({
    id: t.id,
    type: mapType(t.type ?? ""),
    amount: t.amount,
    date: t.date ?? t.createdAt ?? new Date().toISOString(),
    description: t.description?.trim() || `${mapType(t.type ?? "")} (${(t.currency ?? currency).toUpperCase()})`,
    status: normalizeTxnStatus(t.status),
    currency: (t.currency ?? currency).toUpperCase(),
  }));
}

// ==================== USER MANAGEMENT APIs ====================

/**
 * GET /users/profile
 * Get current user profile. MUST pass currency for financial data - no cross-currency aggregation.
 * @param currency - Required for wallet balances (USD, ZIG, ZAR, etc). Prevents mixing currencies.
 */
export async function getUserProfile(currency: string = 'USD'): Promise<UserData> {
  const [profileRes, walletsRes, limitRes] = await Promise.all([
    apiCall<{ success: boolean; data: Record<string, unknown> }>('/user/profile'),
    apiCall<{ success: boolean; data: WalletApiRow[] }>("/user/wallets"),
    apiCall<{ success: boolean; data: { creditLimit: number; availableCredit: number; financialDisciplineScore: number } }>(
      `/credit/limit?currency=${encodeURIComponent(currency)}`
    ).catch(() => ({ success: false, data: { creditLimit: 200, availableCredit: 200, financialDisciplineScore: 50 } })),
  ]);
  const p = profileRes.data || {};
  const wallets = (walletsRes.data || []).map(normalizeWalletRow);
  const primaryWallet = wallets.find((w) => w.currencyCode === currency);
  const usdWallet = wallets.find((w) => w.currencyCode === 'USD') as { accountNumber?: string } | undefined;
  const zigWallet = wallets.find((w) => w.currencyCode === 'ZIG') as { accountNumber?: string } | undefined;
  const zarWallet = wallets.find((w) => w.currencyCode === 'ZAR') as { accountNumber?: string } | undefined;
  const limit = limitRes.data || { creditLimit: 200, availableCredit: 200, financialDisciplineScore: 50 };
  const activeCredit = primaryWallet?.activeLoanBalance ?? 0;
  const dobRaw = p.dateOfBirth as string | Date | undefined | null;
  const dobStr =
    dobRaw == null
      ? ''
      : typeof dobRaw === 'string'
        ? dobRaw.slice(0, 10)
        : new Date(dobRaw as Date).toISOString().slice(0, 10);
  return {
    memberId: (p.id as string) || '',
    fullName: (p.fullName as string) || '',
    title: '',
    dateOfBirth: dobStr,
    dateOfBirthLocked: Boolean(p.dateOfBirthLocked),
    phoneNumber: (p.phoneNumber as string) || '',
    accountNumber: primaryWallet?.accountNumber || usdWallet?.accountNumber || '',
    nationalIdNumber: '',
    studentStaffId: '',
    salaryRange: null,
    email: (p.email as string) || '',
    mobile: (p.phoneNumber as string) || '',
    accountType: ((p.accountType as string) || 'student').toLowerCase(),
    walletBalance: primaryWallet?.balance ?? 0,
    approvedCreditWallet: primaryWallet?.approvedCreditBalance ?? 0,
    activeCredit,
    availableCreditLimit: limit.availableCredit || 200,
    loanPrincipal: 0,
    transactions: [],
    disciplineScore: limit.financialDisciplineScore || 50,
    creditScore: limit.financialDisciplineScore || 82,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 0,
    finEraAccountNumbers: {
      usd: usdWallet?.accountNumber || '',
      zig: zigWallet?.accountNumber || '',
      zar: zarWallet?.accountNumber || '',
    },
  };
}

/**
 * PUT /user/profile — partial update (fullName, phoneNumber, dateOfBirth as ISO YYYY-MM-DD).
 */
export async function updateUserProfile(data: Partial<UserData>): Promise<Partial<UserData>> {
  const body: Record<string, string> = {};
  if (data.fullName != null && data.fullName !== "") body.fullName = data.fullName;
  if (data.phoneNumber != null && data.phoneNumber !== "") body.phoneNumber = data.phoneNumber;
  if (data.dateOfBirth != null && data.dateOfBirth !== "") body.dateOfBirth = data.dateOfBirth;

  const res = await apiCall<{ success: boolean; data: Record<string, unknown> }>("/user/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const p = res.data || {};
  const dobRaw = p.dateOfBirth as string | Date | undefined | null;
  const dobStr =
    dobRaw == null
      ? undefined
      : typeof dobRaw === "string"
        ? dobRaw.slice(0, 10)
        : new Date(dobRaw as Date).toISOString().slice(0, 10);
  const phone = (p.phoneNumber as string) || undefined;
  return {
    memberId: (p.id as string) || undefined,
    fullName: (p.fullName as string) || undefined,
    dateOfBirth: dobStr,
    dateOfBirthLocked: p.dateOfBirthLocked !== undefined ? Boolean(p.dateOfBirthLocked) : undefined,
    phoneNumber: phone,
    mobile: phone,
    email: (p.email as string) || undefined,
  };
}

/**
 * POST /users/complete-profile
 * Complete user profile after registration
 * Backend should:
 * - Save additional profile details
 * - Update account status
 */
export async function completeProfile(profileData: any): Promise<{ success: boolean; user: UserData }> {
  // TODO: Replace with actual API call
  return apiCall('/users/complete-profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}

// ==================== WALLET & TRANSACTION APIs ====================

/**
 * POST /wallet/deposit
 * Deposit funds into savings wallet
 * Backend should:
 * - Validate amount
 * - Process payment through payment gateway
 * - Update wallet balance
 * - Create transaction record
 * - Update financial metrics (disciplineScore)
 * - Return updated balance and transaction
 */
export async function depositFunds(data: DepositRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  const currency = data.currency ?? (() => { throw new Error("Currency REQUIRED for deposit. Select account first."); })();
  const res = await apiCall<{ success: boolean; data: { transaction: Transaction; newBalance: number } }>('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      method: data.method,
      purpose: data.purpose,
      currency,
    }),
  });
  if (res?.data) return res.data;
  throw new Error('Deposit failed');
}

/**
 * POST /wallet/withdraw
 * Withdraw funds from savings wallet
 * Backend should:
 * - Validate sufficient balance
 * - Check if funds are not locked (loan collateral)
 * - Process withdrawal to selected method
 * - Update wallet balance
 * - Create transaction record
 * - Return updated balance and transaction
 */
export async function withdrawFunds(data: WithdrawalRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  const currency = data.currency ?? (() => { throw new Error("Currency REQUIRED for withdraw. Select account first."); })();
  const res = await apiCall<{ success: boolean; data: { transaction: Transaction; newBalance: number } }>('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      method: data.method,
      destination: data.destination,
      currency,
    }),
  });
  if (res?.data) return res.data;
  throw new Error('Withdrawal failed');
}

/**
 * POST /wallet/transfer-credit-to-savings
 * Transfer from approved credit to FinCash wallet for that currency. REQUIRES currency for isolation.
 */
export async function transferCreditToSavings(amount: number, currency: string = 'USD'): Promise<{
  approvedCreditWallet: number;
  balance: number;
  fee?: number;
  netCredited?: number;
  transaction: Transaction;
  currency?: string;
  walletLabel?: string;
}> {
  const res = await apiCall<{
    success: boolean;
    data: {
      approvedCreditWallet: number;
      balance: number;
      fee?: number;
      netCredited?: number;
      transaction: Transaction;
      currency?: string;
      walletLabel?: string;
    };
  }>('/wallet/transfer-credit-to-savings', {
    method: 'POST',
    body: JSON.stringify({ amount, currency }),
  });
  if (res?.data) return res.data;
  throw new Error('Transfer failed');
}

/**
 * GET /wallet/transactions
 * Get user transaction history
 * Backend should:
 * - Fetch all transactions for user
 * - Support pagination
 * - Support filtering by type/date
 */
/**
 * Get transactions - currency REQUIRED. Routes to getTransactionsByCurrency.
 */
export async function getTransactions(params?: {
  limit?: number;
  offset?: number;
  page?: number;
  type?: string;
  currency?: string;
}): Promise<Transaction[]> {
  const currency = params?.currency ?? "USD";
  return getTransactionsByCurrency(currency, {
    page: params?.page,
    limit: params?.limit,
  });
}

// ==================== CREDIT APPLICATION APIs ====================

/**
 * POST /loans/apply
 * Alias for credit application - submit loan request
 * Backend should implement same logic as /credit/apply
 */
export async function applyLoan(data: CreditApplication): Promise<{
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  totalCredit?: number;
  message: string;
}> {
  return apiCall('/loans/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /credit/apply-instant
 * Submit credit application with instant approval (auto-disburse)
 */
export async function applyCreditApplication(data: CreditApplication): Promise<{
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  totalCredit?: number;
  message: string;
}> {
  const res = await apiCall<{
    success: boolean;
    data: {
      applicationId: string;
      status: string;
      approvedAmount?: number;
      totalCredit?: number;
      transaction?: Transaction;
    };
  }>('/credit/apply-instant', {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      creditType: data.creditType,
      withCollateral: data.withCollateral ?? false,
      currency: data.currency ?? 'USD',
    }),
  });
  if (res?.data) {
    return {
      applicationId: res.data.applicationId,
      status: (res.data.status ?? 'approved') as 'approved' | 'pending' | 'rejected',
      approvedAmount: res.data.approvedAmount,
      totalCredit: res.data.totalCredit,
      message: 'Loan approved successfully',
    };
  }
  throw new Error('Credit application failed');
}

/**
 * GET /credit/application/:id
 * Get credit application status
 */
export async function getCreditApplicationStatus(applicationId: string): Promise<{
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  message?: string;
}> {
  // TODO: Replace with actual API call
  return apiCall(`/credit/application/${applicationId}`);
}

/**
 * GET /credit/limits
 * Get credit limits based on user type
 * Backend should:
 * - Return min/max limits based on accountType
 * - Consider user's financial discipline score
 */
export async function getCreditLimits(): Promise<{
  min: number;
  max: number;
  availableCreditLimit: number;
}> {
  // TODO: Replace with actual API call
  return apiCall('/credit/limits');
}

/**
 * GET /credit/limit?currency=
 * Per-currency eligibility (no cross-currency aggregation).
 */
export async function getCreditLimitForCurrency(currency: string): Promise<{
  creditLimit: number;
  availableCredit: number;
  financialDisciplineScore: number;
}> {
  const res = await apiCall<{
    success: boolean;
    data: { creditLimit: number; availableCredit: number; financialDisciplineScore: number };
  }>(`/credit/limit?currency=${encodeURIComponent(currency)}`);
  const d = res.data ?? { creditLimit: 200, availableCredit: 200, financialDisciplineScore: 50 };
  return {
    creditLimit: d.creditLimit,
    availableCredit: d.availableCredit,
    financialDisciplineScore: d.financialDisciplineScore,
  };
}

/**
 * POST /credit/approve
 * Approve credit application (admin/automated)
 * Backend should:
 * - Calculate final credit amount
 * - Add to approvedCreditWallet
 * - Update activeCredit
 * - Lock 20% of savings if applicable
 * - Create loan record
 * - Send notification to user
 */
export async function approveCreditApplication(applicationId: string): Promise<{
  success: boolean;
  approvedAmount: number;
  totalCredit: number;
  repaymentSchedule: any;
}> {
  // TODO: Replace with actual API call
  return apiCall(`/credit/approve/${applicationId}`, {
    method: 'POST',
  });
}

// ==================== REPAYMENT APIs ====================

/**
 * POST /loans/repay
 * Alias for repayment - make loan repayment
 * Backend should implement same logic as /repayment/make-payment
 */
export async function repayLoan(data: RepaymentRequest): Promise<{
  transaction: Transaction;
  remainingBalance: number;
  loanFullyPaid: boolean;
  updatedScores: { disciplineScore: number; creditScore: number };
}> {
  return apiCall('/loans/repay', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /wallet/repay
 * Make loan repayment
 */
export async function makeRepayment(data: RepaymentRequest): Promise<{
  transaction: Transaction;
  remainingBalance: number;
  loanFullyPaid: boolean;
  updatedScores: {
    disciplineScore: number;
    creditScore: number;
  };
}> {
  if (!data.currency?.trim()) {
    throw new Error('Currency is required for repayment');
  }
  const currency = data.currency.trim().toUpperCase();
  const res = await apiCall<{
    success: boolean;
    data: {
      transactionId: string;
      remainingBalance: number;
      loanFullyPaid: boolean;
    };
  }>('/wallet/repay', {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      method: data.method,
      deductFromWallet: data.method === 'savings',
      currency,
    }),
  });
  if (res?.data) {
    return {
      transaction: {
        id: res.data.transactionId,
        type: 'repayment',
        amount: data.amount,
        date: new Date().toISOString(),
        description: `Repayment via ${data.method}`,
        status: 'completed',
      },
      remainingBalance: res.data.remainingBalance,
      loanFullyPaid: res.data.loanFullyPaid,
      updatedScores: {
        disciplineScore: 0,
        creditScore: 0,
      },
    };
  }
  throw new Error('Repayment failed');
}

/**
 * GET /repayment/schedule
 * Get loan repayment schedule
 * Backend should:
 * - Calculate monthly installments
 * - Return due dates
 * - Show payment history
 */
export async function getRepaymentSchedule(): Promise<{
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  monthlyInstallment: number;
  nextDueDate: string;
  schedule: Array<{
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  }>;
}> {
  // TODO: Replace with actual API call
  return apiCall('/repayment/schedule');
}

// ==================== FINANCIAL METRICS APIs ====================

/**
 * GET /metrics/financial-identity
 * Get user's financial identity metrics
 * Backend should:
 * - Calculate disciplineScore based on:
 *   - Savings consistency
 *   - On-time payments
 *   - Savings-to-credit ratio
 * - Calculate creditScore based on:
 *   - Payment history
 *   - Credit utilization
 *   - Account age
 * - Calculate loyaltyProgress (successful loan cycles)
 * - Return real-time metrics
 */
export async function getFinancialMetrics(): Promise<{
  disciplineScore: number;
  creditScore: number;
  loyaltyProgress: number;
  missedPayments: number;
  onTimePayments: number;
  creditTier: string;
  sfisTier: string;
}> {
  // TODO: Replace with actual API call
  return apiCall('/metrics/financial-identity');
}

// ==================== ADMIN APIs ====================

/**
 * GET /admin/overview
 * Get platform overview (admin only)
 * Backend should:
 * - Calculate total capital deployed
 * - Calculate active credit portfolio
 * - Calculate repayment rate
 * - Count total users
 * - Show user distribution by type
 * - Show default rate
 */
export async function getAdminOverview(): Promise<{
  totalCapital: number;
  activeCreditPortfolio: number;
  repaymentRate: number;
  totalUsers: number;
  usersByType: {
    student: number;
    staff: number;
    alumni: number;
  };
  defaultRate: number;
}> {
  // TODO: Replace with actual API call
  return apiCall('/admin/overview');
}

/**
 * GET /admin/users
 * Get all users (admin only)
 */
export async function getAllUsers(params?: {
  page?: number;
  limit?: number;
  accountType?: string;
}): Promise<{
  users: UserData[];
  total: number;
  page: number;
  totalPages: number;
}> {
  // TODO: Replace with actual API call
  const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return apiCall(`/admin/users${queryString}`);
}

// ==================== BIOMETRIC APIs ====================

/** POST /api/biometric/liveness - Liveness check payload */
export interface LivenessRequest {
  image: string; // base64
  type: "liveness_check";
}

export async function submitLivenessCheck(data: LivenessRequest): Promise<ApiResponse<{ verified: boolean }>> {
  try {
    return await apiCall('/biometric/liveness', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Liveness check failed' };
  }
}

/** POST /api/biometric/id-verify - ID verification */
export interface IdVerifyRequest {
  id_front: string;
  id_back: string;
}

export async function submitIdVerification(data: IdVerifyRequest): Promise<ApiResponse<{ verified: boolean }>> {
  try {
    return await apiCall('/biometric/id-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'ID verification failed' };
  }
}

/** Convert base64 (data URL or raw) to Blob */
function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
  const [, b64] = dataUrl.split(',');
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

/** POST /kyc/upload - Upload KYC document (multipart). documentType: ID_FRONT | ID_BACK | SELFIE | PROOF_OF_ADDRESS */
export async function uploadKycDocument(
  base64Image: string,
  documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE' | 'PROOF_OF_ADDRESS'
): Promise<ApiResponse<{ documentId: string; status: string }>> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
  const blob = base64ToBlob(base64Image);
  const file = new File([blob], `kyc-${documentType.toLowerCase()}.jpg`, { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/kyc/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: data.message || `Upload failed (${res.status})` };
  }
  return { success: true, message: 'Uploaded', data: data.data };
}

// ==================== NOTIFICATIONS API ====================
/** Aligns with Prisma `Notification` + `NotificationType` from backend-core */

export interface NotificationItem {
  id: string;
  type: string;
  priority?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  actionUrl?: string | null;
}

export interface NotificationListPayload {
  notifications: NotificationItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{ success: boolean; message?: string; data?: NotificationListPayload }> {
  try {
    const q = new URLSearchParams();
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.unreadOnly) q.set("unreadOnly", "true");
    const qs = q.toString();
    return await apiCall(`/notifications${qs ? `?${qs}` : ""}`);
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to load notifications",
    };
  }
}

export async function markNotificationRead(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiCall(`/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update notification" };
  }
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiCall(`/notifications/read-all`, { method: "PUT" });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to mark all as read" };
  }
}

// ==================== LEARNING HUB API ====================

export interface FinancialTerm {
  id: string;
  term: string;
  slug: string;
  simpleDefinition: string;
  advancedDefinition: string | null;
  example: string | null;
  relatedTerms: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number | null;
  tier: "FREE" | "PREMIUM";
  status: string;
  orderIndex: number;
  icon: string | null;
  color: string | null;
  termsIncluded: string[];
}

export interface ProgressItem {
  id: string;
  moduleId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPercent: number;
  timeSpentSeconds: number;
  completedAt: string | null;
  module: LearningModule;
}

export interface LearningRecommendation {
  type: "LESSON" | "MICRO_COURSE" | "WARNING" | "NUDGE";
  moduleId?: string;
  moduleSlug?: string;
  title: string;
  message: string;
  reason?: string;
}

export async function getLearningModules(tier?: "FREE" | "PREMIUM"): Promise<{ success: boolean; data: LearningModule[] }> {
  const q = tier ? `?tier=${tier}` : "";
  return apiCall<{ success: boolean; data: LearningModule[] }>(`/learning/modules${q}`);
}

export async function getFinancialTerms(): Promise<{ success: boolean; data: FinancialTerm[] }> {
  return apiCall<{ success: boolean; data: FinancialTerm[] }>("/learning/terms");
}

export async function getFinancialTerm(slug: string): Promise<{ success: boolean; data: FinancialTerm }> {
  return apiCall<{ success: boolean; data: FinancialTerm }>(`/learning/terms/${encodeURIComponent(slug)}`);
}

export async function recordTermInteraction(
  termSlug: string,
  interactionType: "click" | "hover" | "ask_ai",
  context?: string
): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>("/learning/terms/interact", {
    method: "POST",
    body: JSON.stringify({ termSlug, interactionType, context }),
  });
}

export async function getLearningProgress(): Promise<{
  success: boolean;
  data: { progress: ProgressItem[]; completedCount: number; totalModules: number };
}> {
  return apiCall("/learning/progress");
}

export async function updateLearningProgress(
  moduleId: string,
  data: { status?: string; progressPercent?: number; timeSpentSeconds?: number }
): Promise<{ success: boolean; data: ProgressItem }> {
  return apiCall(`/learning/progress/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getLearningRecommendations(): Promise<{
  success: boolean;
  data: LearningRecommendation[];
}> {
  return apiCall("/learning/recommendations");
}

export async function logRecommendationShown(
  type: string,
  opts?: { moduleId?: string; termId?: string; context?: string; reason?: string }
): Promise<{ success: boolean }> {
  return apiCall("/learning/recommendations/log", {
    method: "POST",
    body: JSON.stringify({ type, ...opts }),
  });
}

/** GET /learning/content - Combined modules + progress + recommendations (user spec) */
export async function getLearningContent(): Promise<{
  modules: Array<LearningModule & { progress: { status: string; progress_percentage: number } }>;
  profile: { financial_discipline_score: number; learning_streak_days: number; last_active_at?: string };
  recommendations: LearningRecommendation[];
  financialTerms: string[];
}> {
  return apiCall("/learning/content");
}

/** POST /learning/term-interaction - User spec (term, interaction_type, context_module_id) */
export async function recordTermInteractionSpec(
  term: string,
  interactionType: string,
  contextModuleId?: string
): Promise<{ success: boolean }> {
  return apiCall("/learning/term-interaction", {
    method: "POST",
    body: JSON.stringify({
      term,
      interaction_type: interactionType,
      context_module_id: contextModuleId,
    }),
  });
}

/** GET /learning/term/:term - Get term definition with contextual relevance */
export interface TermDefinition {
  simple: string;
  advanced: string;
  example: string;
  contextual: string;
}

export async function getTermDefinition(term: string): Promise<TermDefinition> {
  const res = await apiCall<TermDefinition>(`/learning/term/${encodeURIComponent(term)}`);
  return res;
}

/** POST /learning/progress - User spec (module_id, progress_percentage, time_spent, quiz_scores) */
export async function updateLearningProgressSpec(
  moduleId: string,
  data: { progress_percentage?: number; time_spent?: number; quiz_scores?: unknown[] }
): Promise<unknown> {
  return apiCall("/learning/progress", {
    method: "POST",
    body: JSON.stringify({
      module_id: moduleId,
      progress_percentage: data.progress_percentage,
      time_spent: data.time_spent,
      quiz_scores: data.quiz_scores,
    }),
  });
}

// ==================== PARTNER PROGRAM API ====================

export interface PartnerProgramApplication {
  fullName?: string;
  idNumber?: string;
  contactNumber?: string;
  location?: string;
  services?: string[];
}

export interface PartnerProgramData {
  id?: string;
  status: "NOT_APPLIED" | "PENDING" | "APPROVED" | "REJECTED";
  applicationData?: PartnerProgramApplication | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function getPartnerProgram(): Promise<{ success: boolean; data: PartnerProgramData }> {
  return apiCall("/partner-program");
}

export async function getPartnerProgramStatus(): Promise<{ success: boolean; data: PartnerProgramData }> {
  return apiCall("/partner-program/status");
}

export async function applyPartnerProgram(data: PartnerProgramApplication): Promise<{ success: boolean; data: PartnerProgramData }> {
  return apiCall("/partner-program/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== PAYMENTS API ====================

export interface MobileMoneyDepositRequest {
  amount: number;
  phoneNumber: string;
  provider: string;
}

export async function mobileMoneyDeposit(data: MobileMoneyDepositRequest): Promise<ApiResponse> {
  try {
    return await apiCall('/payments/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Deposit failed' };
  }
}

export interface BankDepositRequest {
  amount: number;
  bankId: string;
  accountNumber: string;
}

export async function bankDeposit(data: BankDepositRequest): Promise<ApiResponse> {
  try {
    return await apiCall('/bank/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Bank deposit failed' };
  }
}

// ==================== HELPER: Mock Mode for Development ====================

/**
 * Set this to true during development to use mock data
 * Set to false when backend is ready
 */
export const USE_MOCK_DATA = true;

/**
 * Mock API responses for development
 * Remove this when connecting to real backend
 */
export const mockResponses = {
  register: (data: RegisterRequest) => ({
    user: {
      memberId: 'MEM' + Date.now().toString().slice(-8),
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      dateOfBirthLocked: false,
      phoneNumber: data.phoneNumber,
      accountNumber: Date.now().toString().slice(-9) + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      nationalIdNumber: '',
      studentStaffId: '',
      email: data.email,
      mobile: data.phoneNumber,
      accountType: data.accountType,
      walletBalance: 0,
      approvedCreditWallet: 0,
      activeCredit: 0,
      availableCreditLimit: data.accountType === 'student' ? 200 : 2000,
      loanPrincipal: 0,
      transactions: [],
      lastLogin: Date.now(),
      disciplineScore: 75,
      creditScore: 82,
      loyaltyProgress: 0,
      missedPayments: 0,
      onTimePayments: 0,
    },
    message: 'Registration successful. Please verify your OTP.',
  }),
};

// Export all for easy importing
export default {
  register,
  login,
  verifyOTP,
  verifyRegistrationEmail,
  resendOTP,
  logout,
  getUserProfile,
  updateUserProfile,
  completeProfile,
  depositFunds,
  withdrawFunds,
  transferCreditToSavings,
  getTransactions,
  applyCreditApplication,
  applyLoan,
  getCreditApplicationStatus,
  getCreditLimits,
  approveCreditApplication,
  makeRepayment,
  repayLoan,
  getRepaymentSchedule,
  getFinancialMetrics,
  getAdminOverview,
  getAllUsers,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};