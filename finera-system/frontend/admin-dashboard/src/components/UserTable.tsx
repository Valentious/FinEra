import { useState, useEffect } from 'react';
import { fetchUsers, type AdminUser } from '../api';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface UserTableProps {
  onSuspend?: () => void;
}

export function UserTable({ onSuspend }: UserTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    setLoading(true);
    fetchUsers({
      status: filter === 'all' ? undefined : filter,
      page: 1,
      limit: 20,
      search: search || undefined,
    })
      .then(({ data, pagination: p }) => {
        setUsers(data);
        setPagination(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, search]);

  const suspendUser = async (userId: string) => {
    if (!confirm('Suspend this user? Their wallet will be frozen.')) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' }),
      });
      if (res.ok) {
        onSuspend?.();
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed');
      }
    } catch (e) {
      alert('Failed to suspend');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>User Management</h3>
        <div className="table-actions">
          <div className="search-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch((e.target as HTMLInputElement).value)}
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-muted">{u.email}</div>
                  </div>
                </td>
                <td>{u.role}</td>
                <td>
                  <div className="balance-cell">
                    ${u.walletBalance?.toLocaleString() ?? 0}
                    {!u.meetsMinimumBalance && (
                      <span className="alert-badge">
                        <AlertCircle size={12} /> Below min
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${u.status.toLowerCase()}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  {u.status === 'ACTIVE' && (
                    <button
                      className="btn-icon danger"
                      onClick={() => suspendUser(u.id)}
                      title="Suspend"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-footer">
        Showing {users.length} of {pagination.total}
      </p>
    </div>
  );
}
