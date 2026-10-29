import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  minHeight?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
  minHeight = '240px',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.875rem',
        minHeight,
        padding: '2rem',
        backgroundColor: 'var(--peach-light)',
        border: '1px solid var(--muted-peach)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'var(--muted-peach)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-burgundy)',
        }}
      >
        <AlertCircle size={26} />
      </div>
      <div>
        <h4 style={{ color: 'var(--primary-burgundy)', marginBottom: '0.25rem', fontSize: '1.05rem' }}>
          {title}
        </h4>
        <p style={{ maxWidth: 440, margin: '0 auto', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary"
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      )}
    </div>
  );
};
