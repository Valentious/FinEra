import type { DashboardMetrics } from '../api';
import { DollarSign, Users, Wallet, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface MetricsGridProps {
  metrics: DashboardMetrics | null;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Capital',
      value: `$${metrics.capital.total.toLocaleString()}`,
      subtext: `${metrics.capital.capitalReserveRatio.toFixed(1)}% reserve ratio`,
      icon: DollarSign,
      trend: 'up' as const,
    },
    {
      title: 'Available for Loans',
      value: `$${metrics.capital.availableForLoans.toLocaleString()}`,
      subtext: `${((metrics.capital.availableForLoans / metrics.capital.total) * 100).toFixed(1)}% of capital`,
      icon: TrendingUp,
      trend: metrics.capital.availableForLoans > 10000 ? 'up' : 'down',
    },
    {
      title: 'Total Users',
      value: metrics.users.total,
      subtext: `${metrics.users.newToday} new today`,
      icon: Users,
      trend: 'neutral' as const,
    },
    {
      title: 'Active Wallets',
      value: metrics.wallets.active,
      subtext: `$${metrics.wallets.totalBalance.toLocaleString()} total balance`,
      icon: Wallet,
      trend: 'neutral' as const,
    },
    {
      title: 'Transactions (Month)',
      value: metrics.transactions.thisMonth,
      subtext: `$${metrics.transactions.avgValue.toFixed(0)} avg value`,
      icon: Activity,
      trend: metrics.transactions.thisMonth > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Portfolio Risk',
      value: `${metrics.risk.portfolioRiskScore}/100`,
      subtext: `${metrics.credit.byRiskTier.CRITICAL?.count ?? 0} critical risk`,
      icon: AlertTriangle,
      trend: metrics.risk.portfolioRiskScore >= 60 ? 'up' : 'down',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">{card.title}</p>
                <p className="stat-value">{card.value}</p>
                <p className="stat-subtext">{card.subtext}</p>
              </div>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
            </div>
            {card.trend !== 'neutral' && (
              <div className={`stat-trend ${card.trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                {card.trend === 'up' ? 'Positive' : 'Needs attention'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
