import React from 'react';
import type { TransactionStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TransactionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = status.toLowerCase();

  let badgeClass = 'badge-neutral';
  let icon = <HelpCircle size={13} />;

  switch (normStatus) {
    case 'completed':
      badgeClass = 'badge-success';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'pending':
      badgeClass = 'badge-warning';
      icon = <Clock size={13} />;
      break;
    case 'processing':
      badgeClass = 'badge-info';
      icon = <Clock size={13} />;
      break;
    case 'failed':
      badgeClass = 'badge-danger';
      icon = <XCircle size={13} />;
      break;
    case 'unknown':
    default:
      badgeClass = 'badge-neutral';
      icon = <AlertTriangle size={13} />;
      break;
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'btn-sm' : ''}`}>
      {icon}
      <span style={{ textTransform: 'capitalize' }}>{normStatus}</span>
    </span>
  );
};
