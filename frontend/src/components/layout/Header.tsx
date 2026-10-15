import React from 'react';
import { Menu, RefreshCw, Radio } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import type { NavPage } from './Sidebar';

interface HeaderProps {
  currentPage: NavPage;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onToggleSidebar }) => {
  const { lastUpdated, isRefreshing, refreshDashboard, error, isDemoMode } = useDashboard();

  const getPageTitle = (page: NavPage) => {
    switch (page) {
      case 'overview':
        return {
          title: 'System Overview',
          subtitle: 'Live transaction volume, service health, and BullMQ queue activity'
        };
      case 'transactions':
        return {
          title: 'Transaction Explorer',
          subtitle: 'SQLite transaction records, status tracking, reconciliation, and search'
        };
      case 'performance':
        return {
          title: 'API Performance & Latency',
          subtitle: 'Throughput, P99 response times, and HTTP error rate analysis'
        };
      case 'queue':
        return {
          title: 'BullMQ Queue & Worker Monitoring',
          subtitle: 'Redis connection, job state distribution, and dead letter recovery'
        };
      case 'alerts':
        return {
          title: 'System Alerts & Incidents',
          subtitle: 'Real-time telemetry alerts and dependency health checks'
        };
    }
  };

  const { title, subtitle } = getPageTitle(currentPage);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', padding: '6px 8px' }}
          aria-label="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h1>
            {isDemoMode && (
              <span className="badge badge-info" style={{ fontSize: '11px' }}>
                Simulation Active
              </span>
            )}
          </div>
          <p className="subtitle" style={{ fontSize: '12px' }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Connection status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: error ? 'var(--danger)' : 'var(--success)',
            backgroundColor: error ? 'var(--danger-bg)' : 'var(--success-bg)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? 'var(--danger-border)' : 'var(--success-border)'}`
          }}
        >
          <Radio size={12} className={error ? '' : 'pulse'} />
          <span style={{ fontWeight: 500 }}>
            {error ? 'API Disconnected' : 'Connected to port 3000'}
          </span>
        </div>

        {/* Last refreshed */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Updated: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatLastUpdated(lastUpdated)}</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={refreshDashboard}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm"
          title="Refresh data"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
