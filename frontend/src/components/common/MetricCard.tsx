import React from 'react';
import { AlertCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  icon?: React.ReactNode;
  subtext?: string;
  trend?: string;
  isUnavailable?: boolean;
  unavailableReason?: string;
  demoValue?: string | number;
  isDemoMode?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  subtext,
  isUnavailable = false,
  unavailableReason = 'Metric not collected by current Express backend',
  demoValue,
  isDemoMode = false
}) => {
  const showDemo = isUnavailable && isDemoMode && demoValue !== undefined;

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>

      <div>
        {isUnavailable && !showDemo ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0' }}>
              <span className="badge badge-neutral" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <AlertCircle size={12} />
                Unavailable in API
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
              {unavailableReason}
            </div>
          </div>
        ) : (
          <div className="metric-value">
            {showDemo ? demoValue : (value !== null && value !== undefined ? value : '—')}
            {showDemo && (
              <span
                className="badge badge-info"
                style={{ fontSize: '10px', marginLeft: '8px', verticalAlign: 'middle' }}
              >
                Demo
              </span>
            )}
          </div>
        )}
      </div>

      {subtext && (
        <div className="metric-subtext">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
