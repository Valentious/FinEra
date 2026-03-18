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

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

// ==================== HELPER FUNCTIONS ====================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
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
  // TODO: Replace with actual API call
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  // TODO: Replace with actual API call
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  // TODO: Replace with actual API call
  return apiCall('/auth/logout', {
    method: 'POST',
  });
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
  // TODO: Replace with actual API call
  return apiCall('/users/profile');
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