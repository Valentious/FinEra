import { useState, useEffect } from 'react';

interface HealthData {
  database: { status: string; error?: string };
  timestamp: string;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/system')
      .then((r) => r.json())
      .then((res) => res.data && setHealth(res.data))
      .catch(() => setHealth({ database: { status: 'unhealthy' }, timestamp: new Date().toISOString() }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Checking health...</div>;
  if (!health) return <div className="error">Failed to fetch health</div>;

  return (
    <div className="health-card">
      <h3>System Health</h3>
      <div className="health-grid">
        <div className={`health-item ${health.database.status}`}>
          <span className="health-dot" />
          <div>
            <p className="health-label">Database</p>
            <p className="health-status">{health.database.status}</p>
            {health.database.error && (
              <p className="health-error">{health.database.error}</p>
            )}
          </div>
        </div>
      </div>
      <p className="health-timestamp">Last check: {new Date(health.timestamp).toLocaleString()}</p>
    </div>
  );
}
