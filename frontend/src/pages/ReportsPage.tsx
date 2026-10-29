import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Printer,
} from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { api } from '../services/api';
import type { DashboardStats, NavigationTab, ScreeningRecord } from '../types';

interface ReportsPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const generatedDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, historyRes] = await Promise.allSettled([
        api.getStats(),
        api.getScreenings(50, 0),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      } else {
        throw new Error('Unable to aggregate screening statistics.');
      }

      if (historyRes.status === 'fulfilled') {
        setRecentRecords(historyRes.value.items || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating report.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!recentRecords.length) return;

    const headers = [
      'ID',
      'Created At',
      'Age',
      'Gender',
      'Prediction',
      'Model Score',
      'Risk Assessment',
    ];

    const rows = recentRecords.map((r) => [
      r.id,
      r.created_at,
      r.questionnaire.Age,
      r.questionnaire.Gender,
      r.prediction,
      (r.model_score * 100).toFixed(1) + '%',
      `"${r.risk_assessment.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sugarsense_screening_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '3rem' }}>
        <LoadingState message="Compiling executive screening report..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <ErrorState
          title="Report Generation Failed"
          message={error || 'Unable to aggregate screening metrics.'}
          onRetry={loadReportData}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 1040, margin: '0 auto' }}>
      {/* Header and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--primary-burgundy)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Aggregated Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Executive Screening Report
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Generated summary of historical diabetes risk screenings and reported symptom distributions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={recentRecords.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: recentRecords.length === 0 ? 'not-allowed' : 'pointer',
              opacity: recentRecords.length === 0 ? 0.6 : 1,
            }}
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} />
            Print Report
          </button>

          <button
            type="button"
            onClick={() => onNavigate('new-screening')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--primary-burgundy)',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Plus size={16} />
            New Screening
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Report Top Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-burgundy)' }}>
              SugarSense Analytics Report
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Population Symptom Risk-Screening Synthesis
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Generated On
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {generatedDate}
            </div>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            1. Total Screening Activity & Outcomes
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Total Screenings Stored
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {stats.total_screenings}
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--peach-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-burgundy)', textTransform: 'uppercase' }}>
                Elevated Risk (Positive)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-burgundy)', marginTop: '0.25rem' }}>
                {stats.positive_predictions}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {stats.positive_percentage.toFixed(1)}% of total cohort
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: 'var(--accent-low-risk-bg)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-low-risk)', textTransform: 'uppercase' }}>
                Low Risk (Negative)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-low-risk)', marginTop: '0.25rem' }}>
                {stats.negative_predictions}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {stats.negative_percentage.toFixed(1)}% of total cohort
              </div>
            </div>
          </div>
        </div>

        {/* Most Commonly Reported Symptoms */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            2. Most Frequently Reported Symptoms
          </h2>
          {stats.top_reported_symptoms.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No symptom trends recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.top_reported_symptoms.map((s) => (
                <div key={s.symptom} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.symptom}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {s.count} occurrences ({s.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      width: '100%',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, s.percentage)}%`,
                        backgroundColor: 'var(--primary-burgundy)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Screenings Table (up to 15) */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            3. Recent Individual Screenings Audit Log
          </h2>
          {recentRecords.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No individual screening history available in database.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Record ID</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Demographics</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Prediction</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.slice(0, 15).map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace' }}>#{rec.id.slice(0, 8)}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {new Date(rec.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {rec.questionnaire.Age}y, {rec.questionnaire.Gender}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: rec.prediction === 'Positive' ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)' }}>
                        {rec.prediction === 'Positive' ? 'Elevated Risk' : 'Low Risk'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {(rec.model_score * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formal Disclaimer Box */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong>Clinical Verification Notice:</strong> This report represents aggregated output from the SugarSense
          educational screening platform. Data points reflect algorithmic evaluations derived from survey responses.
          These results must not be utilized as diagnostic determinations or clinical substitutes for laboratory glucose
          assays, HbA1c tests, or certified medical evaluations.
        </div>
      </div>
    </div>
  );
};
