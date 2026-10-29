import { useEffect, useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InsightsPage } from './pages/InsightsPage';
import { NewScreeningPage } from './pages/NewScreeningPage';
import { ReportsPage } from './pages/ReportsPage';
import { ScreeningHistoryPage } from './pages/ScreeningHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import type { HealthStatus, NavigationTab } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const fetchHealth = async () => {
    try {
      const status = await api.getHealth();
      setHealth(status);
    } catch {
      // Backend may be offline or starting up
      setHealth(null);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Periodically refresh health status every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim() !== '') {
      setActiveTab('history');
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={handleNavigate}
      health={health}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
    >
      {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {activeTab === 'new-screening' && <NewScreeningPage onNavigate={handleNavigate} />}
      {activeTab === 'history' && (
        <ScreeningHistoryPage
          onNavigate={handleNavigate}
          initialSearchQuery={searchTerm}
        />
      )}
      {activeTab === 'insights' && <InsightsPage onNavigate={handleNavigate} />}
      {activeTab === 'reports' && <ReportsPage onNavigate={handleNavigate} />}
      {activeTab === 'settings' && (
        <SettingsPage onNavigate={handleNavigate} onRefreshHealth={fetchHealth} />
      )}
    </AppLayout>
  );
}

export default App;
