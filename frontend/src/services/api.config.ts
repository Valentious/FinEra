/**
 * FinEra - API Service Configuration
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || "ws://localhost:4000",
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};

export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  user: {
    profile: "/user/profile",
    wallets: "/user/wallets",
  },
  transactions: {
    deposit: "/transactions/deposit",
    withdraw: "/transactions/withdraw",
    history: "/transactions",
    details: (id: string) => `/transactions/${id}`,
  },
  credit: {
    score: "/credit/score",
    limit: "/credit/limit",
    apply: "/credit/apply",
    loans: "/credit/loans",
  },
  kyc: {
    upload: "/kyc/upload",
    status: "/kyc/status",
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
  },
};
