/**
 * Mock API Service for Development
 * 
 * This provides mock responses using localStorage to simulate backend behavior.
 * Use this during development until the real backend is ready.
 * 
 * To switch to real backend:
 * 1. Set USE_MOCK_DATA = false in api.ts
 * 2. Update BASE_URL in api.ts to your backend URL
 */

import type { 
  UserData, 
  Transaction, 
  LoginRequest, 
  RegisterRequest,
  OTPVerificationRequest,
  DepositRequest,
  WithdrawalRequest,
  RepaymentRequest,
  CreditApplication
} from './api';

// ==================== HELPER FUNCTIONS ====================

function generateMemberId(): string {
  return 'MEM' + Date.now().toString().slice(-8);
}

function generateAccountNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp.slice(-9) + random;
}

function calculateCreditLimit(accountType: 'student' | 'staff' | 'alumni'): number {
  const limits = {
    student: 200,
    staff: 2000,
    alumni: 2000,
  };
  return limits[accountType];
}

function calculateActiveCredit(principal: number): number {
  const serviceFee = principal * 0.015; // 1.5%
  const interest = principal * 0.18; // 18%
  return principal + serviceFee + interest;
}

function saveUserData(user: UserData): void {
  localStorage.setItem(`member_${normalizeEmail(user.email)}`, JSON.stringify(user));
}

/** Extended user with per-currency wallet balances and auth (mock-only) */
type MockUserData = UserData & {
  walletBalances?: Record<string, number>;
  /** Password hash for mock auth - never returned to caller */
  _passwordHash?: string;
  /** Until email OTP is verified (mirrors backend PENDING_VERIFICATION) */
  _pendingVerification?: boolean;
};

/** Hash password for mock storage (browser-safe, mirrors backend intent) */
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(data))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strip internal fields before exposing user (never return _passwordHash) */
function toPublicUser(u: MockUserData): UserData {
  const { _passwordHash, _pendingVerification, ...rest } = u;
  void _pendingVerification;
  return rest as UserData;
}

function loadUserData(email: string): MockUserData | null {
  const key = `member_${normalizeEmail(email)}`;
  const saved = localStorage.getItem(key);
  const parsed = saved ? JSON.parse(saved) : null;
  if (!parsed) return null;
  // Migrate legacy users: single savingsBalance → per-currency
  if (!parsed.walletBalances || typeof parsed.walletBalances !== 'object') {
    parsed.walletBalances = {
      USD: parsed.savingsBalance ?? 0,
      ZIG: 0,
      ZAR: 0,
    };
    saveUserData(parsed);
  }
  let migrated = false;
  if (parsed.dateOfBirth === undefined) {
    parsed.dateOfBirth = '';
    migrated = true;
  }
  if (parsed.dateOfBirthLocked === undefined) {
    parsed.dateOfBirthLocked = false;
    migrated = true;
  }
  if (migrated) saveUserData(parsed);
  return parsed;
}

function getWalletBalance(user: MockUserData, currency: string): number {
  const c = (currency || 'USD').toUpperCase();
  return (user.walletBalances?.[c] ?? 0);
}

function setWalletBalance(user: MockUserData, currency: string, amount: number): void {
  const c = (currency || 'USD').toUpperCase();
  if (!user.walletBalances) user.walletBalances = { USD: 0, ZIG: 0, ZAR: 0 };
  user.walletBalances[c] = amount;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Pending 6-digit codes (mock “email send”) */
const EMAIL_VERIFY_KEY = (e: string) => `email_verify_${normalizeEmail(e)}`;
/** Send a 6-digit code (stored locally; in production the backend emails it). */
export async function mockSendEmailVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(EMAIL_VERIFY_KEY(normalized), JSON.stringify({ code, expiresAt }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Email verification code for ${normalized}: ${code}`);
  }
  return { success: true, message: "Verification code sent to your email." };
}

/** POST /auth/verify-email (mock): verify OTP and issue session. Accepts any 6-digit code for local progress. */
export async function mockVerifyRegistrationEmail(
  email: string,
  code: string
): Promise<{ user: UserData; token: string; message: string }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("Enter a 6-digit code.");
  }

  const user = loadUserData(normalized) as MockUserData | null;
  if (!user) {
    throw new Error("User not found. Register again.");
  }
  if (user._pendingVerification === false) {
    throw new Error("Email already verified.");
  }

  localStorage.removeItem(EMAIL_VERIFY_KEY(normalized));
  user._pendingVerification = false;
  saveUserData(user);

  const token = "mock_jwt_token_" + Date.now();
  localStorage.setItem("auth_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", "mock_refresh_" + Date.now());
  localStorage.setItem("active_user_email", normalized);

  return {
    user: toPublicUser(user),
    token,
    message: "Email verified.",
  };
}

// ==================== MOCK API IMPLEMENTATIONS ====================

export async function mockRegister(data: RegisterRequest): Promise<{ user: UserData; message: string }> {
  await delay(800);
  const email = normalizeEmail(data.email);

  const existing = loadUserData(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(data.password);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(EMAIL_VERIFY_KEY(email), JSON.stringify({ code, expiresAt }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Registration OTP for ${email}: ${code}`);
  }

  const user: MockUserData = {
    memberId: generateMemberId(),
    fullName: data.fullName,
    title: "",
    dateOfBirth: data.dateOfBirth,
    dateOfBirthLocked: false,
    phoneNumber: data.phoneNumber,
    accountNumber: generateAccountNumber(),
    nationalIdNumber: "",
    studentStaffId: "",
    salaryRange: null,
    email,
    mobile: data.phoneNumber,
    accountType: data.accountType,
    savingsBalance: 0,
    approvedCreditWallet: 0,
    activeCredit: 0,
    availableCreditLimit: calculateCreditLimit(data.accountType),
    loanPrincipal: 0,
    transactions: [],
    disciplineScore: 75,
    creditScore: 82,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 0,
    walletBalances: { USD: 0, ZIG: 0, ZAR: 0 },
    _passwordHash: passwordHash,
    _pendingVerification: true,
  };

  saveUserData(user);

  return {
    user: toPublicUser(user),
    message: "Check your email for a verification code (mock: see browser console).",
  };
}

/**
 * Login: CORRECT 2-step flow (mirrors backend).
 * Step 1: Find user by email (secondary key)
 * Step 2: Compare password hash (never query password in same step)
 */
export async function mockLogin(data: LoginRequest): Promise<{ user: UserData; token: string }> {
  await delay(600);
  const email = normalizeEmail(data.email);

  // STEP 1: Fetch user by email only
  const user = loadUserData(email);
  if (!user) {
    throw new Error("User not found");
  }

  // STEP 2: Validate password (bcrypt-style: compare hash, not plaintext)
  const storedHash = (user as MockUserData)._passwordHash;
  if (storedHash) {
    const valid = await verifyPassword(data.password, storedHash);
    if (!valid) {
      throw new Error("Incorrect password");
    }
  }
  if ((user as MockUserData)._pendingVerification) {
    throw new Error("Please verify your email before signing in.");
  }
  // Legacy users without _passwordHash: allow login (migration path)

  const updatedUser = { ...user, lastLogin: Date.now() };
  saveUserData(updatedUser);

  return {
    user: toPublicUser(updatedUser),
    token: "mock_jwt_token_" + Date.now(),
  };
}

export async function mockVerifyOTP(data: OTPVerificationRequest): Promise<{ success: boolean; message: string }> {
  await mockVerifyRegistrationEmail(data.email, data.otp);
  return { success: true, message: "OTP verified successfully" };
}

export async function mockGetUserProfile(currency?: string): Promise<UserData> {
  await delay(300);

  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Per-currency: return savingsBalance for requested currency
  if (currency) {
    const bal = getWalletBalance(user, currency);
    return { ...user, savingsBalance: bal };
  }
  // No currency: legacy fallback - use USD balance
  return { ...user, savingsBalance: getWalletBalance(user, 'USD') };
}

export async function mockUpdateUserProfile(data: Partial<UserData>): Promise<Partial<UserData>> {
  await delay(500);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = { ...user, ...data };
  saveUserData(updatedUser);

  return updatedUser;
}

export async function mockDepositFunds(data: DepositRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  await delay(1000);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const currency = (data.currency || 'USD').toUpperCase();
  const prevBal = getWalletBalance(user, currency);
  const newBal = prevBal + data.amount;
  setWalletBalance(user, currency, newBal);

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Deposit via ${data.method} - ${data.purpose}`,
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = currency;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    transaction: transaction as Transaction,
    newBalance: newBal,
  };
}

export async function mockWithdrawFunds(data: WithdrawalRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  await delay(1000);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const currency = (data.currency || 'USD').toUpperCase();
  const currBal = getWalletBalance(user, currency);
  const availableBalance = user.activeCredit > 0 ? currBal * 0.8 : currBal;
  if (data.amount > availableBalance) {
    throw new Error('Insufficient available balance');
  }

  const newBal = currBal - data.amount;
  setWalletBalance(user, currency, newBal);

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'withdrawal',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Withdrawal via ${data.method}`,
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = currency;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    transaction: transaction as Transaction,
    newBalance: newBal,
  };
}

export async function mockTransferCreditToSavings(amount: number, currency: string = 'USD'): Promise<{ 
  approvedCreditWallet: number; 
  savingsBalance: number; 
  transaction: Transaction 
}> {
  await delay(800);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  if (amount > user.approvedCreditWallet) {
    throw new Error('Insufficient funds in Approved Credit Wallet');
  }

  const c = (currency || 'USD').toUpperCase();
  const prevBal = getWalletBalance(user, c);
  const newBal = prevBal + amount;
  setWalletBalance(user, c, newBal);
  user.approvedCreditWallet -= amount;

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount,
    date: new Date().toISOString(),
    description: 'Transfer from Approved Credit to Savings',
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = c;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    approvedCreditWallet: user.approvedCreditWallet,
    savingsBalance: newBal,
    transaction: transaction as Transaction,
  };
}

type WalletResponse = { id: string; currencyCode: string; accountNumber: string; savingsBalance: number; balance: number; approvedCreditBalance: number; activeLoanBalance: number };

export async function mockGetWalletsByCurrency(currency?: string): Promise<WalletResponse[]> {
  await delay(200);
  const email = localStorage.getItem('active_user_email');
  if (!email) return [];
  const user = loadUserData(email);
  if (!user) return [];
  const fe = (user as UserData).finEraAccountNumbers;
  const baseAccount = user.accountNumber || '';
  const accounts: Record<string, string> = fe ? { usd: fe.usd, zig: fe.zig, zar: fe.zar } : { usd: baseAccount, zig: baseAccount, zar: baseAccount };
  // Scalable: return all supported currencies when no filter (USD, ZiG, ZAR, etc.)
  const currencies = currency ? [currency.toUpperCase()] : ['USD', 'ZIG', 'ZAR'];
  return currencies.map((c) => {
    const bal = getWalletBalance(user, c);
    const key = c === 'ZIG' ? 'zig' : c === 'ZAR' ? 'zar' : 'usd';
    return {
      id: `finera-${c.toLowerCase()}`,
      currencyCode: c,
      accountNumber: accounts[key] || `FE-${c}-${baseAccount.slice(-6)}`,
      savingsBalance: bal,
      balance: bal,
      approvedCreditBalance: user.approvedCreditWallet,
      activeLoanBalance: user.activeCredit,
    };
  });
}

export async function mockGetTransactionsByCurrency(currency: string): Promise<Transaction[]> {
  await delay(200);
  const email = localStorage.getItem('active_user_email');
  if (!email) return [];
  const user = loadUserData(email);
  if (!user) return [];
  const list = user.transactions ?? [];
  const c = (currency || 'USD').toUpperCase();
  return list.filter((t) => ((t as Transaction & { currency?: string }).currency ?? 'USD') === c);
}

export async function mockApplyCreditApplication(data: CreditApplication): Promise<{
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  totalCredit?: number;
  message: string;
}> {
  await delay(2000); // Simulate processing
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has active loan
  if (user.activeCredit > 0) {
    return {
      applicationId: 'APP' + Date.now(),
      status: 'rejected',
      message: 'You already have an active loan',
    };
  }

  // Check savings requirement (20% for non-emergency) - use currency-specific balance
  const creditCurrency = (data.currency || 'USD').toUpperCase();
  const savingsForCurrency = getWalletBalance(user, creditCurrency);
  if (data.creditType !== 'emergency' && savingsForCurrency < data.amount * 0.2) {
    return {
      applicationId: 'APP' + Date.now(),
      status: 'rejected',
      message: 'Insufficient savings. Minimum 20% of loan amount required.',
    };
  }

  const totalCredit = calculateActiveCredit(data.amount);

  // Auto-approve for mock
  const transaction: Transaction = {
    id: 'TXN' + Date.now(),
    type: 'loan',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `${data.creditType} loan approved`,
    status: 'completed',
  };

  user.approvedCreditWallet += data.amount;
  user.activeCredit = totalCredit;
  user.loanPrincipal = data.amount;
  user.transactions.push(transaction);
  saveUserData(user);

  return {
    applicationId: 'APP' + Date.now(),
    status: 'approved',
    approvedAmount: data.amount,
    totalCredit,
    message: 'Loan approved successfully',
  };
}

export async function mockMakeRepayment(data: RepaymentRequest): Promise<{
  transaction: Transaction;
  remainingBalance: number;
  loanFullyPaid: boolean;
  updatedScores: {
    disciplineScore: number;
    creditScore: number;
  };
}> {
  await delay(1200);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  if (data.amount > user.activeCredit) {
    throw new Error('Repayment amount exceeds outstanding balance');
  }

  // Deduct from savings if payment method is savings
  if (data.method === 'savings') {
    if (data.amount > user.savingsBalance) {
      throw new Error('Insufficient savings balance');
    }
    user.savingsBalance -= data.amount;
  }

  const transaction: Transaction = {
    id: 'TXN' + Date.now(),
    type: 'repayment',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Repayment via ${data.method}`,
    status: 'completed',
  };

  user.activeCredit -= data.amount;
  user.onTimePayments += 1;
  
  const loanFullyPaid = user.activeCredit <= 0;
  
  if (loanFullyPaid) {
    user.activeCredit = 0;
    user.loanPrincipal = 0;
    user.loyaltyProgress += 1;
    user.disciplineScore = Math.min(100, user.disciplineScore + 5);
    user.creditScore = Math.min(100, user.creditScore + 3);
  } else {
    user.disciplineScore = Math.min(100, user.disciplineScore + 1);
    user.creditScore = Math.min(100, user.creditScore + 1);
  }

  user.transactions.push(transaction);
  saveUserData(user);

  return {
    transaction,
    remainingBalance: user.activeCredit,
    loanFullyPaid,
    updatedScores: {
      disciplineScore: user.disciplineScore,
      creditScore: user.creditScore,
    },
  };
}

export async function mockGetRepaymentSchedule(): Promise<{
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
  await delay(500);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const totalAmount = user.activeCredit;
  const monthlyInstallment = totalAmount / 12; // Assume 12 months
  const amountPaid = 0; // Mock data
  
  const schedule = Array.from({ length: 12 }, (_, i) => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return {
      dueDate: dueDate.toISOString(),
      amount: monthlyInstallment,
      status: 'pending' as const,
    };
  });

  return {
    totalAmount,
    amountPaid,
    remainingBalance: user.activeCredit,
    monthlyInstallment,
    nextDueDate: schedule[0].dueDate,
    schedule,
  };
}

export async function mockGetFinancialMetrics(): Promise<{
  disciplineScore: number;
  creditScore: number;
  loyaltyProgress: number;
  missedPayments: number;
  onTimePayments: number;
  creditTier: string;
  sfisTier: string;
}> {
  await delay(300);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  let creditTier = 'Standard';
  if (user.creditScore >= 85) creditTier = 'Elite';
  else if (user.creditScore >= 70) creditTier = 'Growth';
  else if (user.creditScore >= 50) creditTier = 'Standard';
  else if (user.creditScore >= 30) creditTier = 'Watch';
  else creditTier = 'Restricted';

  let sfisTier = 'Fair';
  if (user.creditScore >= 85) sfisTier = 'Excellent';
  else if (user.creditScore >= 70) sfisTier = 'Good';
  else if (user.creditScore >= 50) sfisTier = 'Fair';
  else if (user.creditScore >= 30) sfisTier = 'Building';
  else sfisTier = 'Restricted';

  return {
    disciplineScore: user.disciplineScore,
    creditScore: user.creditScore,
    loyaltyProgress: user.loyaltyProgress,
    missedPayments: user.missedPayments,
    onTimePayments: user.onTimePayments,
    creditTier,
    sfisTier,
  };
}

export async function mockGetAdminOverview(): Promise<{
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
  await delay(600);
  
  // Mock data for admin overview
  return {
    totalCapital: 2500000,
    activeCreditPortfolio: 1875000,
    repaymentRate: 94.5,
    totalUsers: 2200,
    usersByType: {
      student: 1500,
      staff: 450,
      alumni: 250,
    },
    defaultRate: 2.3,
  };
}