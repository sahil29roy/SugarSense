import React from 'react';
import {
  FileBarChart,
  HeartPulse,
  History,
  Info,
  LayoutDashboard,
  LineChart,
  PlusCircle,
  Settings,
  X,
} from 'lucide-react';
import type { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-screening', label: 'New Screening', icon: PlusCircle },
    { id: 'history', label: 'Screening History', icon: History },
    { id: 'insights', label: 'Health Insights', icon: LineChart },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 36, 36, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 99,
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpenMobile
            ? 'translateX(0)'
            : 'translateX(0)', // Desktop default
        }}
        className={`sidebar-container ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--topbar-height)',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'var(--primary-burgundy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(134, 31, 36, 0.25)',
              }}
            >
              <HeartPulse size={22} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--dark-burgundy)',
                }}
              >
                SugarSense
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                }}
              >
                Risk Screening
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="mobile-close-btn"
            style={{
              padding: '0.4rem',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{ padding: '1.25rem 0.875rem', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 0.75rem 0.65rem',
            }}
          >
            Navigation
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9375rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--primary-burgundy)' : 'transparent',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(134, 31, 36, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--peach-light)';
                        e.currentTarget.style.color = 'var(--dark-burgundy)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon size={19} style={{ opacity: isActive ? 1 : 0.8 }} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Supportive Info Card */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              backgroundColor: 'var(--peach-light)',
              border: '1px solid var(--muted-peach)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-burgundy)' }}>
              <Info size={16} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Health Awareness</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Early symptom awareness empowers proactive lifestyle choices and timely clinical consultations.
            </p>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-container {
            transform: translateX(-100%) !important;
          }
          .sidebar-container.mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
        @media (min-width: 1025px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
