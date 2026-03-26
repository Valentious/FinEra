/**
 * Service Layer Entry Point
 * 
 * This file automatically switches between mock and real API based on USE_MOCK_DATA flag
 * 
 * To use real backend:
 * 1. Set USE_MOCK_DATA = false in this file
 * 2. Update BASE_URL in api.ts
 * 3. Ensure backend implements all the documented endpoints
 */

import * as realApi from './api';
import * as mockApi from './mockApi';

// ==================== CONFIGURATION ====================

/**
 * Set to false when backend is ready and running (PostgreSQL + backend-core on :4000)
 * Set to true to use mock data when backend is unavailable
 */
export const USE_MOCK_DATA = true;

if (USE_MOCK_DATA && typeof window !== 'undefined') {
  console.warn('[FinEra] Using mock data (USE_MOCK_DATA=true). Set to false for real backend.');
}

// ==================== API SELECTOR ====================

export const apiService = USE_MOCK_DATA ? {
  // Authentication
  register: mockApi.mockRegister,
  login: mockApi.mockLogin,
  verifyOTP: mockApi.mockVerifyOTP,
  verifyRegistrationEmail: mockApi.mockVerifyRegistrationEmail,
  resendOTP: async (email: string) => mockApi.mockSendEmailVerificationCode(email),
  logout: async () => ({ success: true }),

  // User Management
  getUserProfile: mockApi.mockGetUserProfile,
  updateUserProfile: mockApi.mockUpdateUserProfile,
  completeProfile: async (data: any) => ({ success: true, user: await mockApi.mockGetUserProfile() }),

  // Wallet & Transactions
  depositFunds: mockApi.mockDepositFunds,
  withdrawFunds: mockApi.mockWithdrawFunds,
  transferCreditToSavings: mockApi.mockTransferCreditToSavings,
  getTransactions: async (params?: { currency?: string }) => {
    const user = await mockApi.mockGetUserProfile();
    const list = user.transactions ?? [];
    if (params?.currency) return list; // mock doesn't filter by currency
    return list;
  },
  getCurrencies: async () => [
    { currencyCode: "USD", displayName: "US Dollar", symbol: "$", status: "active", custodyType: "bank", dashboardConfig: {} },
    { currencyCode: "ZIG", displayName: "Zimbabwe Gold (ZiG)", symbol: "Z$", status: "active", custodyType: "momo", dashboardConfig: {} },
    { currencyCode: "ZAR", displayName: "South African Rand", symbol: "R", status: "active", custodyType: "bank", dashboardConfig: {} },
  ],
  getDashboardConfig: async () => ({}),
  getWalletsByCurrency: mockApi.mockGetWalletsByCurrency,
  getTransactionsByCurrency: mockApi.mockGetTransactionsByCurrency,

  // Credit Applications
  applyCreditApplication: mockApi.mockApplyCreditApplication,
  getCreditApplicationStatus: async (id: string) => ({ status: 'approved' as const, approvedAmount: 1000 }),
  getCreditLimits: async () => {
    const user = await mockApi.mockGetUserProfile();
    const limits = {
      student: { min: 20, max: 200 },
      staff: { min: 30, max: 2000 },
      alumni: { min: 30, max: 2000 },
    };
    const limit = limits[user.accountType];
    return {
      min: limit.min,
      max: limit.max,
      availableCreditLimit: user.availableCreditLimit,
    };
  },
  approveCreditApplication: async (id: string) => ({
    success: true,
    approvedAmount: 1000,
    totalCredit: 1195,
    repaymentSchedule: {},
  }),

  // Repayment
  makeRepayment: mockApi.mockMakeRepayment,
  getRepaymentSchedule: mockApi.mockGetRepaymentSchedule,

  // Financial Metrics
  getFinancialMetrics: mockApi.mockGetFinancialMetrics,

  // Admin
  getAdminOverview: mockApi.mockGetAdminOverview,
  getAllUsers: async () => ({ users: [], total: 0, page: 1, totalPages: 1 }),
} : {
  // Real API calls
  register: realApi.register,
  login: realApi.login,
  verifyOTP: realApi.verifyOTP,
  verifyRegistrationEmail: realApi.verifyRegistrationEmail,
  resendOTP: realApi.resendOTP,
  logout: realApi.logout,
  getUserProfile: realApi.getUserProfile,
  updateUserProfile: realApi.updateUserProfile,
  completeProfile: realApi.completeProfile,
  depositFunds: realApi.depositFunds,
  withdrawFunds: realApi.withdrawFunds,
  transferCreditToSavings: realApi.transferCreditToSavings,
  getTransactions: realApi.getTransactions,
  getCurrencies: realApi.getCurrencies,
  getDashboardConfig: realApi.getDashboardConfig,
  getWalletsByCurrency: realApi.getWalletsByCurrency,
  getTransactionsByCurrency: realApi.getTransactionsByCurrency,
  applyCreditApplication: realApi.applyCreditApplication,
  getCreditApplicationStatus: realApi.getCreditApplicationStatus,
  getCreditLimits: realApi.getCreditLimits,
  approveCreditApplication: realApi.approveCreditApplication,
  makeRepayment: realApi.makeRepayment,
  getRepaymentSchedule: realApi.getRepaymentSchedule,
  getFinancialMetrics: realApi.getFinancialMetrics,
  getAdminOverview: realApi.getAdminOverview,
  getAllUsers: realApi.getAllUsers,
};

// Export types
export type { UserData, Transaction, CreditApplication, FinEraAccountNumbers, BankLinkingData, CurrencyConfig } from './api';
export { checkBackendHealth } from './api';

// Export default
export default apiService;
