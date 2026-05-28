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
  verifyPhone: mockApi.mockVerifyPhone,
  resendOTP: async (email: string) => mockApi.mockSendEmailVerificationCode(email),
  resendPhoneOtp: mockApi.mockResendPhoneOtp,
  logout: async () => ({ success: true }),
  requestPasswordReset: mockApi.mockRequestPasswordReset,
  verifyPasswordResetOtp: mockApi.mockVerifyPasswordResetOtp,
  completePasswordReset: mockApi.mockCompletePasswordReset,

  // User Management
  getUserProfile: mockApi.mockGetUserProfile,
  updateUserProfile: mockApi.mockUpdateUserProfile,
  completeProfile: mockApi.mockCompleteProfile,

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
    { currencyCode: "ZIG", displayName: "Zimbabwe Gold (ZiG)", symbol: "Z$", status: "active", custodyType: "bank", dashboardConfig: {} },
  ],
  getDashboardConfig: async () => ({}),
  getWalletsByCurrency: mockApi.mockGetWalletsByCurrency,
  getTransactionsByCurrency: mockApi.mockGetTransactionsByCurrency,
  getPeerRecipient: mockApi.mockGetPeerRecipient,
  peerTransfer: mockApi.mockPeerTransfer,

  // Credit Applications
  applyCreditApplication: mockApi.mockApplyCreditApplication,
  getCreditApplicationStatus: async (id: string) => ({ status: 'approved' as const, approvedAmount: 1000 }),
  getCreditLimits: async () => {
    const user = await mockApi.mockGetUserProfile();
    const limits = {
      student: { min: 20, max: 30 },
      staff: { min: 30, max: 5000 },
      alumni: { min: 30, max: 5000 },
    };
    const limit = limits[user.accountType];
    return {
      min: limit.min,
      max: limit.max,
      availableCreditLimit: user.availableCreditLimit,
    };
  },
  getCreditLimitForCurrency: mockApi.mockGetCreditLimitForCurrency,
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

  // Notifications (in-app inbox; mirrors ledger / credit / security events from backend)
  getNotifications: mockApi.mockGetNotifications,
  markNotificationRead: mockApi.mockMarkNotificationRead,
  markAllNotificationsRead: mockApi.mockMarkAllNotificationsRead,

  // Admin
  getAdminOverview: mockApi.mockGetAdminOverview,
  getAllUsers: async () => ({ users: [], total: 0, page: 1, totalPages: 1 }),
} : {
  // Real API calls
  register: realApi.register,
  login: realApi.login,
  verifyOTP: realApi.verifyOTP,
  verifyRegistrationEmail: realApi.verifyRegistrationEmail,
  verifyPhone: realApi.verifyPhone,
  resendOTP: realApi.resendOTP,
  resendPhoneOtp: realApi.resendPhoneOtp,
  logout: realApi.logout,
  requestPasswordReset: realApi.requestPasswordReset,
  verifyPasswordResetOtp: realApi.verifyPasswordResetOtp,
  completePasswordReset: realApi.completePasswordReset,
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
  getPeerRecipient: realApi.getPeerRecipient,
  peerTransfer: realApi.peerTransfer,
  applyCreditApplication: realApi.applyCreditApplication,
  getCreditApplicationStatus: realApi.getCreditApplicationStatus,
  getCreditLimits: realApi.getCreditLimits,
  getCreditLimitForCurrency: realApi.getCreditLimitForCurrency,
  approveCreditApplication: realApi.approveCreditApplication,
  makeRepayment: realApi.makeRepayment,
  getRepaymentSchedule: realApi.getRepaymentSchedule,
  getFinancialMetrics: realApi.getFinancialMetrics,
  getNotifications: realApi.getNotifications,
  markNotificationRead: realApi.markNotificationRead,
  markAllNotificationsRead: realApi.markAllNotificationsRead,
  getAdminOverview: realApi.getAdminOverview,
  getAllUsers: realApi.getAllUsers,
};

// Export types
export type {
  UserData,
  Transaction,
  CreditApplication,
  FinEraAccountNumbers,
  CurrencyConfig,
  NotificationItem,
  NotificationListPayload,
  VirtualDebitCard,
} from './api';
export { checkBackendHealth } from './api';

// Export default
export default apiService;
