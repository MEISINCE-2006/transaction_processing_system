import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = <Inbox size={36} />
}) => {
  return (
    <div className="empty-state">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 16px auto' }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
