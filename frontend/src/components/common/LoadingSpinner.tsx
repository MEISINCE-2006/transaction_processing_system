import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  size = 20
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        gap: '12px',
        color: 'var(--text-muted)'
      }}
    >
      <div
        className="spinner"
        style={{ width: `${size}px`, height: `${size}px`, borderColor: 'rgba(37, 99, 235, 0.2)', borderLeftColor: 'var(--primary)' }}
      />
      {message && <span style={{ fontSize: '13px' }}>{message}</span>}
    </div>
  );
};
