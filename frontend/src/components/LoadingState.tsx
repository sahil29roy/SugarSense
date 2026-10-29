import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  minHeight = '240px',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.875rem',
        minHeight,
        color: 'var(--text-secondary)',
        padding: '2rem',
      }}
    >
      <Loader2
        size={32}
        style={{
          color: 'var(--primary-burgundy)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
