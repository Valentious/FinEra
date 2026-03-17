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
  localStorage.setItem(`member_${user.email}`, JSON.stringify(user));
}

function loadUserData(email: string): UserData | null {
  const saved = localStorage.getItem(`member_${email}`);
  return saved ? JSON.parse(saved) : null;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== MOCK API IMPLEMENTATIONS ====================

export async function mockRegister(data: RegisterRequest): Promise<{ user: UserData; message: string }> {
  await delay(800); // Simulate network delay
  
  // Check if user already exists
  const existing = loadUserData(data.email);
  if (existing) {
    throw new Error('User already exists');
  }

  const user: UserData = {
    memberId: generateMemberId(),
    fullName: data.fullName,
    title: '',
    phoneNumber: data.phoneNumber,
    accountNumber: generateAccountNumber(),
    nationalIdNumber: '',
    studentStaffId: '',
    salaryRange: null,
    email: data.email,
    mobile: data.phoneNumber,
    accountType: data.accountType,
    savingsBalance: 0,
    approvedCreditWallet: 0,
    activeCredit: 0,
    availableCreditLimit: calculateCreditLimit(data.accountType),
    loanPrincipal: 0,
    transactions: [],
    lastLogin: Date.now(),
    disciplineScore: 75,
    creditScore: 82,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 0,
  };

  saveUserData(user);
  
  return {
    user,
    message: 'Registration successful. Please verify your OTP.',
  };
}

export async function mockLogin(data: LoginRequest): Promise<{ user: UserData; token: string }> {
  await delay(600);
  
  const user = loadUserData(data.email);
  if (!user) {
    throw new Error('User not found');
  }

  // Update last login
  const updatedUser = { ...user, lastLogin: Date.now() };
  saveUserData(updatedUser);

  return {
    user: updatedUser,
    token: 'mock_jwt_token_' + Date.now(),
  };
}

export async function mockVerifyOTP(data: OTPVerificationRequest): Promise<{ success: boolean; message: string }> {
  await delay(400);
  
  // Mock: Accept any 6-digit OTP
  if (data.otp.length === 6) {
    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }
  
  throw new Error('Invalid OTP');
}

export async function mockGetUserProfile(): Promise<UserData> {
  await delay(300);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function mockUpdateUserProfile(data: Partial<UserData>): Promise<UserData> {
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

  const transaction: Transaction = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Deposit via ${data.method} - ${data.purpose}`,
    status: 'completed',
  };

  user.savingsBalance += data.amount;
  user.transactions.push(transaction);
  saveUserData(user);

  return {
    transaction,
    newBalance: user.savingsBalance,
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

  // Validate sufficient balance
  const availableBalance = user.activeCredit > 0 ? user.savingsBalance * 0.8 : user.savingsBalance;
  if (data.amount > availableBalance) {
    throw new Error('Insufficient available balance');
  }

  const transaction: Transaction = {
    id: 'TXN' + Date.now(),
    type: 'withdrawal',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Withdrawal via ${data.method}`,
    status: 'completed',
  };

  user.savingsBalance -= data.amount;
  user.transactions.push(transaction);
  saveUserData(user);

  return {
    transaction,
    newBalance: user.savingsBalance,
  };
}

export async function mockTransferCreditToSavings(amount: number): Promise<{ 
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

  const transaction: Transaction = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount,
    date: new Date().toISOString(),
    description: 'Transfer from Approved Credit to Savings',
    status: 'completed',
  };

  user.approvedCreditWallet -= amount;
  user.savingsBalance += amount;
  user.transactions.push(transaction);
  saveUserData(user);

  return {
    approvedCreditWallet: user.approvedCreditWallet,
    savingsBalance: user.savingsBalance,
    transaction,
  };
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

  // Check savings requirement (20% for non-emergency)
  if (data.creditType !== 'emergency' && user.savingsBalance < data.amount * 0.2) {
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