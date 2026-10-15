import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  title = 'API Communication Error'
}) => {
  return (
    <div className="alert-banner alert-banner-danger">
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>
        <div>{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: '12px', flexShrink: 0 }}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
};
