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
 * Set to false when backend is ready
 * Set to true to use mock data for development
 */
export const USE_MOCK_DATA = true;

// ==================== API SELECTOR ====================

export const apiService = USE_MOCK_DATA ? {
  // Authentication
  register: mockApi.mockRegister,
  login: mockApi.mockLogin,
  verifyOTP: mockApi.mockVerifyOTP,
  resendOTP: async (email: string) => ({ success: true, message: 'OTP resent' }),
  logout: async () => ({ success: true }),

  // User Management
  getUserProfile: mockApi.mockGetUserProfile,
  updateUserProfile: mockApi.mockUpdateUserProfile,
  completeProfile: async (data: any) => ({ success: true, user: await mockApi.mockGetUserProfile() }),

  // Wallet & Transactions
  depositFunds: mockApi.mockDepositFunds,
  withdrawFunds: mockApi.mockWithdrawFunds,
  transferCreditToSavings: mockApi.mockTransferCreditToSavings,
  getTransactions: async () => {
    const user = await mockApi.mockGetUserProfile();
    return user.transactions;
  },

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
  resendOTP: realApi.resendOTP,
  logout: realApi.logout,
  getUserProfile: realApi.getUserProfile,
  updateUserProfile: realApi.updateUserProfile,
  completeProfile: realApi.completeProfile,
  depositFunds: realApi.depositFunds,
  withdrawFunds: realApi.withdrawFunds,
  transferCreditToSavings: realApi.transferCreditToSavings,
  getTransactions: realApi.getTransactions,
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
export type { UserData, Transaction, CreditApplication, FinEraAccountNumbers, BankLinkingData } from './api';

// Export default
export default apiService;
