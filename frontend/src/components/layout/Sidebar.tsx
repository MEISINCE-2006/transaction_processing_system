import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Activity,
  Layers,
  Bell,
  LogOut,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';

export type NavPage = 'overview' | 'transactions' | 'performance' | 'queue' | 'alerts';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose
}) => {
  const { user, logout } = useAuth();
  const { health, alerts, isDemoMode, setIsDemoMode } = useDashboard();

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const navItems: { id: NavPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={18} /> },
    { id: 'performance', label: 'API Performance', icon: <Activity size={18} /> },
    { id: 'queue', label: 'Queue & Worker', icon: <Layers size={18} /> },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell size={18} />,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined
    }
  ];

  const getHealthBadge = () => {
    if (!health) {
      return (
        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
          Connecting...
        </span>
      );
    }
    if (health.status === 'healthy') {
      return (
        <span className="badge badge-success" style={{ fontSize: '11px' }}>
          Backend Online
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ fontSize: '11px' }}>
        {health.status}
      </span>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35, backdropFilter: 'none' }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Server size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              OpenFabric TPS
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Monitoring Dashboard
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div style={{ padding: '0 6px 6px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Navigation
            </span>
            {getHealthBadge()}
          </div>

          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'none' }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className="badge badge-danger"
                  style={{ borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Demo Mode
              </span>
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={e => setIsDemoMode(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                id="demo-mode-toggle"
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {isDemoMode
                ? 'Previewing simulated performance telemetry graphs.'
                : 'Showing strictly real backend endpoints and data.'}
            </p>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username || 'admin'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Role: {user?.role || 'Administrator'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="btn btn-outline btn-sm"
              style={{ padding: '6px 8px' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
