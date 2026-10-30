import React from 'react';
import {
  Menu,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { HealthStatus, NavigationTab } from '../types';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onNavigate: (tab: NavigationTab) => void;
  health?: HealthStatus | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onNavigate,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '1rem',
      }}
    >
      {/* Left: Mobile hamburger & Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: 520 }}>
        <button
          onClick={onOpenMobileMenu}
          style={{
            display: 'none',
            padding: '0.5rem',
            color: 'var(--text-primary)',
          }}
          className="mobile-hamburger-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search screening ID, symptoms, or status..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.6rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-burgundy)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'var(--bg-main)';
            }}
          />
        </div>
      </div>

      {/* Right: Actions & Context badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Quick CTA */}
        <button
          onClick={() => onNavigate('new-screening')}
          className="btn-primary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}
        >
          <Plus size={16} />
          <span>New Screening</span>
        </button>

        {/* Profile / Context badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingLeft: '0.5rem',
            borderLeft: '1px solid var(--border-color)',
          }}
          className="profile-pill"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'var(--muted-peach)',
              color: 'var(--primary-burgundy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Clinical Screening
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Educational Portal
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .profile-pill {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
