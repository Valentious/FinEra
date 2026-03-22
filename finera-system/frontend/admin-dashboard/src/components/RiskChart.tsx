import type { DashboardMetrics } from '../api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface RiskChartProps {
  metrics: DashboardMetrics | null;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#991B1B', '#3B82F6'];

export function RiskChart({ metrics }: RiskChartProps) {
  if (!metrics) return null;

  const riskData = [
    { name: 'Low', value: metrics.credit.byRiskTier.LOW?.count ?? 0 },
    { name: 'Medium', value: metrics.credit.byRiskTier.MEDIUM?.count ?? 0 },
    { name: 'High', value: metrics.credit.byRiskTier.HIGH?.count ?? 0 },
    { name: 'Critical', value: metrics.credit.byRiskTier.CRITICAL?.count ?? 0 },
    { name: 'Excellent', value: metrics.credit.byRiskTier.EXCELLENT?.count ?? 0 },
  ].filter((d) => d.value > 0);

  const userByType = [
    { name: 'Student', count: metrics.users.byType.STUDENT ?? 0 },
    { name: 'Staff', count: metrics.users.byType.STAFF ?? 0 },
    { name: 'Alumni', count: metrics.users.byType.ALUMNI ?? 0 },
  ];

  return (
    <div className="chart-card">
      <h3 className="chart-title">Risk & User Distribution</h3>
      <div className="chart-grid">
        <div>
          <h4 className="chart-subtitle">Risk Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskData.length ? riskData : [{ name: 'No data', value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(riskData.length ? riskData : [{ name: 'No data', value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="chart-subtitle">Users by Type</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="count" fill="#38bdf8" name="Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="risk-summary">
        <div>
          <p className="risk-label">Portfolio Risk Score</p>
          <p className="risk-value">{metrics.risk.portfolioRiskScore}/100</p>
        </div>
        <div>
          <p className="risk-label">Current Exposure</p>
          <p className="risk-value">${metrics.risk.currentExposure.toLocaleString()}</p>
          <p className="risk-sublabel">Cap: ${metrics.risk.emergencyExposureCap.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
