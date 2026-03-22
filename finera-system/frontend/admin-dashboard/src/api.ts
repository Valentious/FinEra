const API_BASE = '/api/v1/admin';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

export interface DashboardMetrics {
  capital: { total: number; liquid: number; reserved: number; availableForLoans: number; capitalReserveRatio: number };
  users: { total: number; active: number; newToday: number; byType: Record<string, number> };
  wallets: { active: number; totalBalance: number; avgBalance: number };
  credit: {
    totalScored: number;
    defaultRate: number;
    byRiskTier: Record<string, { count: number; value: number }>;
    portfolioRiskScore: number;
  };
  transactions: { total: number; today: number; thisWeek: number; thisMonth: number; completed: number; avgValue: number };
  risk: { portfolioRiskScore: number; exposurePercentage: number; emergencyExposureCap: number; currentExposure: number };
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetchApi<{ success: boolean; data: DashboardMetrics }>('/dashboard/metrics');
  return res.data;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  walletBalance: number;
  meetsMinimumBalance: boolean;
  creditScore?: { overallScore: number; riskLevel: string };
}

export async function fetchUsers(params?: { status?: string; role?: string; page?: number; limit?: number; search?: string }): Promise<{
  data: AdminUser[];
  pagination: { page: number; limit: number; total: number };
}> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.role) q.set('role', params.role);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  const res = await fetchApi<{ success: boolean; data: AdminUser[]; pagination: { page: number; limit: number; total: number } }>(
    `/users?${q}`
  );
  return { data: res.data, pagination: res.pagination };
}

export interface Stats {
  totalUsers: number;
  activeLoans: number;
  defaultRate: number;
  riskDistribution: Record<string, number>;
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetchApi<{ success: boolean; data: Stats }>('/stats');
  return res.data;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  timestamp: string;
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const res = await fetchApi<{ success: boolean; data: ActivityItem[] }>('/activity');
  return res.data;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: { email: string };
}

export async function fetchAuditLogs(limit = 50, offset = 0): Promise<{
  data: AuditLog[];
  pagination: { limit: number; offset: number; total: number };
}> {
  const res = await fetchApi<{ success: boolean; data: AuditLog[]; pagination: { limit: number; offset: number; total: number } }>(
    `/audit?limit=${limit}&offset=${offset}`
  );
  return { data: res.data, pagination: res.pagination };
}
