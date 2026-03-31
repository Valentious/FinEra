const envBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
/** Same-origin + Vite proxy (`/api`, `/ws`) when VITE_API_URL is unset — required for HTTP-only admin cookies. */
export const API_PREFIX = envBase ? `${envBase}/api/v1` : "/api/v1";

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  return fetch(`${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function adminLogout(): Promise<void> {
  await adminFetch("/admin/auth/logout", { method: "POST" });
}

export async function fetchAdminSession(): Promise<boolean> {
  const res = await adminFetch("/admin/auth/me");
  return res.ok;
}

export async function adminLogin(email: string, password: string) {
  const res = await adminFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? "Login failed");
  }
  return json;
}

export async function fetchAdminOverview() {
  const res = await adminFetch("/admin/overview");
  if (!res.ok) throw new Error("Overview failed");
  return res.json() as Promise<{
    data: {
      totalUsers: number;
      activeLoans: number;
      defaultRate: number;
      riskDistribution: { level: string; count: number }[];
      openFraudFlags: number;
      systemHealth: string;
    };
  }>;
}

export async function fetchAdminActivity() {
  const res = await adminFetch("/admin/activity");
  if (!res.ok) throw new Error("Activity failed");
  return res.json();
}

export async function fetchAuditLogs(limit = 50) {
  const res = await adminFetch(`/admin/audit-logs?limit=${limit}`);
  if (!res.ok) throw new Error("Audit logs failed");
  return res.json();
}

export async function fetchServiceHealth() {
  const res = await adminFetch("/admin/services/health");
  if (!res.ok) throw new Error("Health failed");
  return res.json();
}

/** WebSocket URL — session cookie sent on same-origin connections (use Vite proxy in dev). */
export function getAdminWebSocketUrl(): string {
  if (typeof window === "undefined") return "ws://localhost:5173/ws/admin";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/admin`;
}
