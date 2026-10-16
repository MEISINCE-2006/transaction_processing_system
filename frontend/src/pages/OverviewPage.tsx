import React from 'react';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  Radio,
  Layers,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { NavPage } from '../components/layout/Sidebar';

interface OverviewPageProps {
  onNavigate: (page: NavPage) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const {
    health,
    statusCounts,
    totalTransactions,
    recentTransactions,
    alerts,
    clientLatencyMs,
    isLoading,
    error,
    refreshDashboard,
    isDemoMode
  } = useDashboard();

  if (isLoading && !health) {
    return <LoadingSpinner message="Fetching system telemetry and transaction state..." />;
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const queueDepth = health ? health.queue.waiting + health.queue.active + health.queue.delayed : 0;

  return (
    <div>
      {error && <ErrorAlert message={error} onRetry={refreshDashboard} />}

      <div className="alert-banner alert-banner-info" style={{ marginBottom: '20px' }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Backend Connection & Telemetry Status</div>
          <div style={{ fontSize: '12px', marginTop: '2px', lineHeight: '1.4' }}>
            Connected to Express on <code>http://localhost:3000</code>. Transaction statistics and BullMQ queue metrics are live from SQLite and Redis.
            Runtime HTTP throughput (RPS) and APM latency percentiles require a metrics collector (not present in current backend) and are labeled accordingly.
            {isDemoMode && <strong> Simulated demo values are enabled.</strong>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h2>Transaction Statistics (SQLite)</h2>
      </div>
      <div className="grid-cards">
        <MetricCard
          label="Total Transactions"
          value={totalTransactions.toLocaleString()}
          icon={<ArrowLeftRight size={18} />}
          subtext="Total records in SQLite database"
        />
        <MetricCard
          label="Pending Transactions"
          value={(statusCounts?.pending ?? 0).toLocaleString()}
          icon={<Clock size={18} />}
          subtext="Awaiting queue worker processing"
        />
        <MetricCard
          label="Processing Transactions"
          value={(statusCounts?.processing ?? 0).toLocaleString()}
          icon={<RefreshCw size={18} />}
          subtext="Actively submitting to posting service"
        />
        <MetricCard
          label="Completed Transactions"
          value={(statusCounts?.completed ?? 0).toLocaleString()}
          icon={<CheckCircle2 size={18} />}
          subtext="Successfully posted & verified"
        />
        <MetricCard
          label="Failed Transactions"
          value={(statusCounts?.failed ?? 0).toLocaleString()}
          icon={<XCircle size={18} />}
          subtext="Processing retries exhausted"
        />
        <MetricCard
          label="Unknown Status"
          value={(statusCounts?.unknown ?? 0).toLocaleString()}
          icon={<HelpCircle size={18} />}
          subtext="Inconclusive verification state"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h2>Infrastructure & Worker Telemetry</h2>
      </div>
      <div className="grid-cards">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Redis Connectivity</span>
            <Radio size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '20px' }}>
            {health?.services.redis === 'connected' ? (
              <span className="badge badge-success" style={{ fontSize: '13px' }}>
                <CheckCircle2 size={14} /> Connected (127.0.0.1:6379)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: '13px' }}>
                <XCircle size={14} /> Disconnected
              </span>
            )}
          </div>
          <div className="metric-subtext">BullMQ broker connection status</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">SQLite Database</span>
            <Database size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '20px' }}>
            {health?.services.database === 'connected' ? (
              <span className="badge badge-success" style={{ fontSize: '13px' }}>
                <CheckCircle2 size={14} /> Connected (WAL mode)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: '13px' }}>
                <XCircle size={14} /> Disconnected
              </span>
            )}
          </div>
          <div className="metric-subtext">transactions.db storage engine</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Queue Depth</span>
            <Layers size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value">
            {queueDepth}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
              jobs in flight
            </span>
          </div>
          <div className="metric-subtext">
            Waiting: {health?.queue.waiting ?? 0} | Active: {health?.queue.active ?? 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Worker Health</span>
            <Activity size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ fontSize: '20px' }}>
            {health?.status === 'healthy' ? (
              <span className="badge badge-success" style={{ fontSize: '13px' }}>
                <CheckCircle2 size={14} /> Healthy (100 Concurrency)
              </span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '13px' }}>
                <AlertTriangle size={14} /> Degraded ({health?.status || 'Unknown'})
              </span>
            )}
          </div>
          <div className="metric-subtext">Completed: {health?.queue.completed ?? 0} | Failed: {health?.queue.failed ?? 0}</div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h2>API Performance Metrics</h2>
      </div>
      <div className="grid-cards">
        <MetricCard
          label="Requests Per Second"
          value={null}
          icon={<Activity size={18} />}
          isUnavailable={true}
          unavailableReason="No runtime APM metrics collector on Express"
          demoValue="1,001 req/s"
          isDemoMode={isDemoMode}
          subtext={isDemoMode ? 'Benchmark capacity: ~1,200 req/s' : undefined}
        />
        <MetricCard
          label="Average API Latency"
          value={clientLatencyMs !== null ? `${clientLatencyMs} ms (Client RTT)` : null}
          icon={<Clock size={18} />}
          isUnavailable={clientLatencyMs === null}
          unavailableReason="Server-side latency histogram unsupported"
          demoValue="85 ms"
          isDemoMode={isDemoMode}
          subtext={clientLatencyMs !== null ? 'Live HTTP round-trip ping to /api/health' : undefined}
        />
        <MetricCard
          label="P99 Latency"
          value={null}
          icon={<Clock size={18} />}
          isUnavailable={true}
          unavailableReason="Latency percentiles not tracked by backend"
          demoValue="210 ms"
          isDemoMode={isDemoMode}
          subtext={isDemoMode ? 'Measured during Autocannon load testing' : undefined}
        />
        <MetricCard
          label="HTTP Error Rate"
          value={null}
          icon={<AlertTriangle size={18} />}
          isUnavailable={true}
          unavailableReason="Error counter endpoint unsupported in backend"
          demoValue="0.00 %"
          isDemoMode={isDemoMode}
          subtext={isDemoMode ? '0 errors observed during benchmark' : undefined}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '16px' }}>Recent Transactions</h3>
              <p className="subtitle">Latest entries stored in SQLite</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="btn btn-outline btn-sm"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No transactions found in database.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <code style={{ fontSize: '12px' }} title={tx.id}>
                          {tx.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.amount.toLocaleString()} {tx.currency}
                      </td>
                      <td>
                        <StatusBadge status={tx.status} size="sm" />
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '16px' }}>System Alerts</h3>
              <p className="subtitle">Real-time health evaluations</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="btn btn-outline btn-sm"
            >
              <span>Alert History</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {activeAlerts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                All Systems Normal
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                No active critical incidents or degraded health warnings detected.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`alert-banner alert-banner-${alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}`}
                  style={{ margin: 0, padding: '10px 12px' }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{alert.title}</div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>{alert.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
