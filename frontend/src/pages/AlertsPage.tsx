import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Filter,
  Check,
  ShieldAlert
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { AlertSeverity } from '../types';

export const AlertsPage: React.FC = () => {
  const { alerts, dismissAlert } = useDashboard();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="badge badge-danger">
            <XCircle size={12} />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={12} />
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="badge badge-info">
            <Info size={12} />
            Info
          </span>
        );
    }
  };

  return (
    <div>
      <div className="alert-banner alert-banner-info" style={{ marginBottom: '20px' }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Backend Alert Storage Capability Note</div>
          <div style={{ fontSize: '12px', marginTop: '2px', lineHeight: '1.4' }}>
            The current Express backend does not maintain a server-side alert database.
            Alerts shown below are evaluated dynamically in real time from live health endpoints (<code>/api/health</code>), SQLite status, Redis connectivity, and BullMQ dead-letter job counts.
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ marginBottom: '20px' }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Incidents</span>
            <Bell size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ color: activeCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {activeCount}
          </div>
          <div className="metric-subtext">Requiring operator attention</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Critical Subsystem Failures</span>
            <ShieldAlert size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {criticalCount}
          </div>
          <div className="metric-subtext">Redis or Database disconnections</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Historical Evaluations</span>
            <CheckCircle2 size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="metric-value">
            {alerts.length}
          </div>
          <div className="metric-subtext">Evaluated in current session</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Severity:</span>
              <select
                className="form-select"
                style={{ width: '130px', padding: '4px 8px', fontSize: '13px' }}
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Status:</span>
              <select
                className="form-select"
                style={{ width: '130px', padding: '4px 8px', fontSize: '13px' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No alerts matching filter
            </h3>
            <p style={{ fontSize: '13px' }}>
              All monitored system components are healthy and operating normally.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className="card"
              style={{
                padding: '16px 20px',
                borderLeft: `4px solid ${
                  alert.severity === 'critical'
                    ? 'var(--danger)'
                    : alert.severity === 'warning'
                    ? 'var(--warning)'
                    : 'var(--info)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {getSeverityBadge(alert.severity)}
                    <span
                      className={`badge ${alert.status === 'active' ? 'badge-warning' : 'badge-neutral'}`}
                      style={{ fontSize: '11px', textTransform: 'capitalize' }}
                    >
                      {alert.status}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Source: <code>{alert.source}</code>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {alert.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {alert.description}
                  </p>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Timestamp: {new Date(alert.timestamp).toLocaleString()} ({new Date(alert.timestamp).toISOString()})
                  </div>
                </div>

                {alert.status === 'active' && (
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="btn btn-outline btn-sm"
                    title="Mark as acknowledged/resolved"
                  >
                    <Check size={13} />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
