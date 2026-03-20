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

/** API base URL - use full URL in dev (backend on different port than frontend) */
export const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string) || "http://localhost:4000/api/v1";

const BASE_URL = API_BASE_URL;

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
  dateOfBirth?: string; // ISO format YYYY-MM-DD (KYC-ready)
  phoneNumber: string;
  accountNumber: string;
  nationalIdNumber: string;
  studentStaffId: string;
  salaryRange?: string | null;
  email: string;
  mobile: string;
  accountType: 'student' | 'staff' | 'alumni';
  savingsBalance: number;
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
}

export interface CreditApplication {
  creditType: 'essential' | 'emergency' | 'business';
  amount: number;
  withCollateral: boolean;
  collateralDetails?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD, validated age >= 16
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
}

export interface WithdrawalRequest {
  amount: number;
  method: string;
  destination?: string;
}

export interface RepaymentRequest {
  amount: number;
  method: string;
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
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Load failed") ||
      (error instanceof TypeError && msg.toLowerCase().includes("fetch"))
    ) {
      throw new Error("Unable to connect. Please check your connection.");
    }
    throw error;
  }
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
      savingsBalance: 0,
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
    message: res.message || 'Registration successful. Please verify your OTP.',
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
 * POST /auth/verify-otp
 * Verify OTP code
 * Backend should:
 * - Validate OTP
 * - Mark account as verified
 * - Return success status
 */
export async function verifyOTP(data: OTPVerificationRequest): Promise<{ success: boolean; message: string }> {
  // TODO: Replace with actual API call
  return apiCall('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /auth/resend-otp
 * Resend OTP to user
 */
export async function resendOTP(email: string): Promise<{ success: boolean; message: string }> {
  // TODO: Replace with actual API call
  return apiCall('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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

// ==================== USER MANAGEMENT APIs ====================

/**
 * GET /users/profile
 * Get current user profile
 * Backend should:
 * - Fetch user from database
 * - Calculate real-time financial metrics
 * - Return complete user data
 */
export async function getUserProfile(): Promise<UserData> {
  const [profileRes, walletsRes, limitRes] = await Promise.all([
    apiCall<{ success: boolean; data: Record<string, unknown> }>('/user/profile'),
    apiCall<{ success: boolean; data: Array<{ currencyCode: string; balance: string; accountNumber: string }> }>('/user/wallets'),
    apiCall<{ success: boolean; data: { creditLimit: number; availableCredit: number; financialDisciplineScore: number } }>('/credit/limit').catch(() => ({ success: false, data: { creditLimit: 200, availableCredit: 200, financialDisciplineScore: 50 } })),
  ]);
  const p = profileRes.data || {};
  const wallets = walletsRes.data || [];
  const usdWallet = wallets.find((w) => w.currencyCode === 'USD');
  const zigWallet = wallets.find((w) => w.currencyCode === 'ZIG');
  const zarWallet = wallets.find((w) => w.currencyCode === 'ZAR');
  const limit = limitRes.data || { creditLimit: 200, availableCredit: 200, financialDisciplineScore: 50 };
  return {
    memberId: (p.id as string) || '',
    fullName: (p.fullName as string) || '',
    title: '',
    dateOfBirth: '',
    phoneNumber: '',
    accountNumber: usdWallet?.accountNumber || '',
    nationalIdNumber: '',
    studentStaffId: '',
    salaryRange: null,
    email: (p.email as string) || '',
    mobile: '',
    accountType: ((p.accountType as string) || 'student').toLowerCase(),
    savingsBalance: parseFloat(usdWallet?.balance || '0') || 0,
    approvedCreditWallet: 0,
    activeCredit: 0,
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
 * PUT /users/profile
 * Update user profile
 * Backend should:
 * - Validate changes
 * - Update database
 * - Return updated user data
 */
export async function updateUserProfile(data: Partial<UserData>): Promise<UserData> {
  // TODO: Replace with actual API call
  return apiCall('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
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
 * - Update savingsBalance
 * - Create transaction record
 * - Update financial metrics (disciplineScore)
 * - Return updated balance and transaction
 */
export async function depositFunds(data: DepositRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  // TODO: Replace with actual API call
  return apiCall('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /wallet/withdraw
 * Withdraw funds from savings wallet
 * Backend should:
 * - Validate sufficient balance
 * - Check if funds are not locked (loan collateral)
 * - Process withdrawal to selected method
 * - Update savingsBalance
 * - Create transaction record
 * - Return updated balance and transaction
 */
export async function withdrawFunds(data: WithdrawalRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  // TODO: Replace with actual API call
  return apiCall('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /wallet/transfer-credit-to-savings
 * Transfer from approved credit wallet to savings wallet
 * Backend should:
 * - Validate amount <= approvedCreditWallet
 * - Deduct from approvedCreditWallet
 * - Add to savingsBalance
 * - Create transaction record
 * - Return updated balances
 */
export async function transferCreditToSavings(amount: number): Promise<{ 
  approvedCreditWallet: number; 
  savingsBalance: number; 
  transaction: Transaction 
}> {
  // TODO: Replace with actual API call
  return apiCall('/wallet/transfer-credit-to-savings', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

/**
 * GET /wallet/transactions
 * Get user transaction history
 * Backend should:
 * - Fetch all transactions for user
 * - Support pagination
 * - Support filtering by type/date
 */
export async function getTransactions(params?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<Transaction[]> {
  // TODO: Replace with actual API call
  const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return apiCall(`/wallet/transactions${queryString}`);
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
 * POST /credit/apply
 * Submit credit application
 * Backend should:
 * - Validate user eligibility
 * - Check savings requirement (20% for non-emergency)
 * - Check if user has active loan
 * - Calculate interest (18%)
 * - Calculate service fee (1.5%)
 * - Calculate total credit amount
 * - Process application through approval workflow
 * - Return application status
 */
export async function applyCreditApplication(data: CreditApplication): Promise<{
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  totalCredit?: number; // principal + interest + fees
  message: string;
}> {
  // TODO: Replace with actual API call
  return apiCall('/credit/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
 * POST /repayment/make-payment
 * Make loan repayment
 * Backend should:
 * - Validate payment amount
 * - Process payment through selected method
 * - Update activeCredit balance
 * - Unlock savings if loan fully repaid
 * - Update onTimePayments or missedPayments
 * - Recalculate creditScore and disciplineScore
 * - Create transaction record
 * - Increment loyaltyProgress if loan completed
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
  // TODO: Replace with actual API call
  return apiCall('/repayment/make-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export async function getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
  try {
    return await apiCall('/notifications');
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Failed to load notifications', data: [] };
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
      phoneNumber: data.phoneNumber,
      accountNumber: Date.now().toString().slice(-9) + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      nationalIdNumber: '',
      studentStaffId: '',
      email: data.email,
      mobile: data.phoneNumber,
      accountType: data.accountType,
      savingsBalance: 0,
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
};