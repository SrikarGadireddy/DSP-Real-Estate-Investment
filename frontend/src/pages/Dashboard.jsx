import { useState, useEffect } from 'react';
import { getDashboardSummary, getDashboardAnalytics } from '../services/dashboardService';
import LoadingSpinner from '../components/LoadingSpinner';

const formatCurrency = (val) => {
  if (val == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumData, anaData] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getDashboardAnalytics().catch(() => null),
        ]);
        setSummary(sumData?.summary || sumData || {});
        setAnalytics(anaData?.analytics || anaData || {});
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert--error">{error}</div>;

  const stats = [
    {
      label: 'Total Invested',
      value: formatCurrency(summary?.total_invested || summary?.totalInvested),
      icon: '💰',
    },
    {
      label: 'Portfolio Value',
      value: formatCurrency(summary?.portfolio_value || summary?.portfolioValue || summary?.property_value),
      icon: '🏠',
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(summary?.monthly_income || summary?.monthlyIncome),
      icon: '📈',
    },
    {
      label: 'ROI',
      value: `${(summary?.roi || summary?.average_roi || 0).toFixed(1)}%`,
      icon: '📊',
    },
    {
      label: 'Active Investments',
      value: summary?.active_investments || summary?.activeInvestments || 0,
      icon: '✅',
    },
  ];

  const recentInvestments = summary?.recent_investments || summary?.recentInvestments || [];
  const byType = analytics?.by_type || analytics?.byType || [];
  const byStatus = analytics?.by_status || analytics?.byStatus || [];

  return (
    <div className="dashboard">
      <h1>Investment Dashboard</h1>

      <div className="dashboard__stats">
        {stats.map((s) => (
          <div className="dashboard-stat-card" key={s.label}>
            <span className="dashboard-stat-card__icon">{s.icon}</span>
            <div>
              <p className="dashboard-stat-card__value">{s.value}</p>
              <p className="dashboard-stat-card__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__section">
          <h2>Recent Investments</h2>
          {recentInvestments.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvestments.map((inv, i) => (
                    <tr key={inv.id || i}>
                      <td>{inv.property_title || inv.property?.title || `Property #${inv.property_id}`}</td>
                      <td>{formatCurrency(inv.amount)}</td>
                      <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge badge--${(inv.status || 'pending').toLowerCase()}`}>
                          {inv.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent investments.</p>
            </div>
          )}
        </div>

        <div className="dashboard__section">
          <h2>Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>By Property Type</h4>
              {byType.length > 0 ? (
                <ul className="analytics-list">
                  {byType.map((item, i) => (
                    <li key={i}>
                      <span>{item.type || item.property_type || item.name}</span>
                      <span className="analytics-list__value">
                        {formatCurrency(item.total || item.amount)} ({item.count || 0})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </div>
            <div className="analytics-card">
              <h4>By Status</h4>
              {byStatus.length > 0 ? (
                <ul className="analytics-list">
                  {byStatus.map((item, i) => (
                    <li key={i}>
                      <span>{item.status || item.name}</span>
                      <span className="analytics-list__value">
                        {formatCurrency(item.total || item.amount)} ({item.count || 0})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
