import React, { useState } from 'react';
import type { HealthStatus, NavigationTab } from '../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  health: HealthStatus | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  health,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'var(--sidebar-width)',
          minWidth: 0,
        }}
        className="main-viewport"
      >
        <Topbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={onSelectTab}
          health={health}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
        />

        <main style={{ flex: 1, padding: '2rem', maxWidth: 1440, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-viewport {
            margin-left: 0 !important;
          }
          main {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};
