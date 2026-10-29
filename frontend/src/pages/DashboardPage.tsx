import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { RecentScreeningsTable } from '../components/RecentScreeningsTable';
import { RiskDistributionChart } from '../components/RiskDistributionChart';
import { ScreeningModal } from '../components/ScreeningModal';
import { ScreeningTrendsChart } from '../components/ScreeningTrendsChart';
import { SummaryCard } from '../components/SummaryCard';
import { SymptomSummary } from '../components/SymptomSummary';
import { api } from '../services/api';
import type { DashboardStats, NavigationTab, ScreeningRecord } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectScreening?: (record: ScreeningRecord) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch stats and recent screenings concurrently
      const [statsRes, historyRes] = await Promise.allSettled([
        api.getStats(),
        api.getScreenings(10, 0),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      } else {
        // Fallback default stats if database is in degraded mode
        setStats({
          total_screenings: 0,
          positive_predictions: 0,
          negative_predictions: 0,
          positive_percentage: 0,
          negative_percentage: 0,
          top_reported_symptoms: [],
          disclaimer: 'Statistics currently unavailable from database.',
        });
      }

      if (historyRes.status === 'fulfilled') {
        setRecentRecords(historyRes.value.items || []);
      } else {
        setRecentRecords([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading SugarSense screening dashboard..." minHeight="450px" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {currentDate}
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome to SugarSense
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Review screening activity, symptom patterns, and educational risk assessments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-screening')}
          className="btn-primary"
          style={{ padding: '0.8rem 1.4rem' }}
        >
          <Activity size={18} />
          <span>Start New Screening</span>
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <SummaryCard
          title="Total Screenings Recorded"
          value={stats?.total_screenings ?? 0}
          subtitle="All completed symptom evaluations"
          icon={Clock}
          iconBg="var(--peach-light)"
          iconColor="var(--primary-burgundy)"
        />
        <SummaryCard
          title="Elevated Risk Predictions"
          value={stats?.positive_predictions ?? 0}
          subtitle={`${stats?.positive_percentage ?? 0}% of completed evaluations`}
          icon={AlertTriangle}
          iconBg="var(--muted-peach)"
          iconColor="var(--dark-burgundy)"
          badgeText={stats?.total_screenings ? `${stats.positive_percentage}%` : undefined}
          badgeType="positive"
        />
        <SummaryCard
          title="Low Risk Predictions"
          value={stats?.negative_predictions ?? 0}
          subtitle={`${stats?.negative_percentage ?? 0}% of completed evaluations`}
          icon={CheckCircle}
          iconBg="var(--accent-low-risk-bg)"
          iconColor="var(--accent-low-risk)"
          badgeText={stats?.total_screenings ? `${stats.negative_percentage}%` : undefined}
          badgeType="negative"
        />
      </div>

      {/* Main Grid: Visuals & Side Column */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="dashboard-main-grid"
      >
        {/* Left Column (Charts and Tables) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trends & Donut Split */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <ScreeningTrendsChart records={recentRecords} />
            <RiskDistributionChart
              positiveCount={stats?.positive_predictions ?? 0}
              negativeCount={stats?.negative_predictions ?? 0}
              positivePercentage={stats?.positive_percentage ?? 0}
              negativePercentage={stats?.negative_percentage ?? 0}
              total={stats?.total_screenings ?? 0}
            />
          </div>

          {/* Recent Screenings Table */}
          <RecentScreeningsTable
            records={recentRecords}
            onViewDetails={(rec) => setSelectedRecord(rec)}
            onViewAll={() => onNavigate('history')}
          />
        </div>

        {/* Right Column (Featured Card, Symptoms, Health Insights) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Featured Screening Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--primary-burgundy)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 8px 24px rgba(134, 31, 36, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 240,
            }}
          >
            {/* Subtle decorative background circle */}
            <div
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: '50%',
                backgroundColor: 'rgba(252, 228, 216, 0.1)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: 'var(--muted-peach)',
                }}
              >
                <Sparkles size={13} />
                <span>Educational Screening</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                Take a Step Towards a Healthier You
              </h3>
              <p style={{ color: 'var(--muted-peach)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Complete a short, 16-feature questionnaire to evaluate potential diabetes risk indicators.
              </p>
            </div>

            <button
              onClick={() => onNavigate('new-screening')}
              className="btn-peach"
              style={{ alignSelf: 'flex-start', marginTop: '1.25rem' }}
            >
              <span>Start Screening</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Commonly Reported Symptoms */}
          <SymptomSummary symptoms={stats?.top_reported_symptoms ?? []} />

          {/* Health Insights Widget */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--dark-burgundy)' }}>
              <HeartPulse size={18} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Screening Insights
              </h4>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {stats && stats.total_screenings > 0 && stats.top_reported_symptoms.length > 0 ? (
                <>
                  Among completed evaluations, <strong>{stats.top_reported_symptoms[0].symptom}</strong> was the most
                  frequently reported symptom ({stats.top_reported_symptoms[0].percentage}% of cases). Remember, multiple
                  co-occurring symptoms warrant professional consultation.
                </>
              ) : (
                'As screenings are completed, aggregate symptom correlations and clinical risk insights will appear here.'
              )}
            </p>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              * Informational analysis only. Not individual medical advice.
            </div>
          </div>
        </div>
      </div>

      {/* Screening Details Modal */}
      <ScreeningModal
        screening={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
