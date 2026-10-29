import React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  minHeight?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  minHeight = '200px',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        minHeight,
        padding: '2rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '0.25rem',
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 600 }}>
          {title}
        </h4>
        <p style={{ maxWidth: 360, margin: '0 auto', fontSize: '0.875rem' }}>
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ marginTop: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
