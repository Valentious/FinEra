/**
 * FinEra Admin Dashboard - Production-grade fintech oversight
 * Real-time monitoring, risk controls, user management
 */

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchDashboardMetrics, fetchStats, fetchActivity, fetchAuditLogs } from './api';
import type { DashboardMetrics, Stats, ActivityItem, AuditLog } from './api';
import { MetricsGrid } from './components/MetricsGrid';
import { RiskChart } from './components/RiskChart';
import { UserTable } from './components/UserTable';
import { AlertsPanel, type Alert } from './components/AlertsPanel';
import { SystemHealth } from './components/SystemHealth';

const TABS = [
  { id: 'overview', name: 'Overview' },
  { id: 'users', name: 'User Management' },
  { id: 'activity', name: 'Activity' },
  { id: 'audit', name: 'Audit Logs' },
  { id: 'system', name: 'System Health' },
];

function OverviewTab({ metrics, onRefresh }: { metrics: DashboardMetrics | null; onRefresh: () => void }) {
  return (
    <div className="tab-content">
      <MetricsGrid metrics={metrics} />
      <div className="chart-section">
        <RiskChart metrics={metrics} />
      </div>
    </div>
  );
}

function ActivityTab() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity()
      .then(setActivities)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading activity...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="activity-list">
      {activities.length ? (
        activities.map((a) => (
          <div key={a.id} className="activity-item">
            <strong>{a.action}</strong> – {a.entityType} {a.entityId}
            {a.userName && <span className="muted"> by {a.userName}</span>}
            <span className="timestamp">{new Date(a.timestamp).toLocaleString()}</span>
          </div>
        ))
      ) : (
        <p className="muted">No recent activity</p>
      )}
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs(50, 0)
      .then(({ data, pagination: p }) => {
        setLogs(data);
        setPagination((prev) => ({ ...prev, ...p }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading audit logs...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="audit-table-wrap">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Entity</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.action}</td>
              <td>{log.entityType} / {log.entityId}</td>
              <td>{log.user?.email ?? log.userId}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Showing {logs.length} of {pagination.total}</p>
    </div>
  );
}

function App() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchMetrics = () => {
    fetchDashboardMetrics()
      .then((data) => {
        setMetrics(data);
        if (data.capital.availableForLoans < 10000 && data.capital.total > 0) {
          setAlerts((prev) => [
            ...prev.filter((a) => a.title !== 'Low Capital'),
            {
              type: 'warning',
              title: 'Low Capital Reserve',
              message: `Available for loans: $${data.capital.availableForLoans.toLocaleString()}`,
              severity: 'high' as const,
            },
          ].slice(0, 10));
        }
        if (data.credit.defaultRate > 10) {
          setAlerts((prev) => [
            ...prev.filter((a) => a.title !== 'High Default Rate'),
            {
              type: 'critical',
              title: 'High Default Rate',
              message: `Default rate at ${data.credit.defaultRate.toFixed(1)}%`,
              severity: 'critical' as const,
            },
          ].slice(0, 10));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (alert: Alert) => {
    setAlerts((prev) => prev.filter((a) => a !== alert));
  };

  if (loading && !metrics) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1>FinEra Admin</h1>
          <p className="nav-subtitle">Real-time financial oversight & system management</p>
          <div className="nav-links">
            {TABS.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.id === 'overview' ? '/' : `/${tab.id}`}
                className={({ isActive }) => (isActive ? 'active' : '')}
                end={tab.id === 'overview'}
              >
                {tab.name}
              </NavLink>
            ))}
          </div>
        </nav>
        <main className="main">
          {error && <div className="error">Error: {error}. Ensure admin service is running on port 4006.</div>}
          <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
          <Routes>
            <Route path="/" element={<OverviewTab metrics={metrics} onRefresh={fetchMetrics} />} />
            <Route path="/users" element={<UserTable onSuspend={fetchMetrics} />} />
            <Route path="/activity" element={<ActivityTab />} />
            <Route path="/audit" element={<AuditTab />} />
            <Route path="/system" element={<SystemHealth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
