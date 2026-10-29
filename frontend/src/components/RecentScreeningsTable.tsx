import React from 'react';
import { ArrowRight, Eye, FileText } from 'lucide-react';
import type { ScreeningRecord } from '../types';

interface RecentScreeningsTableProps {
  records: ScreeningRecord[];
  onViewDetails: (record: ScreeningRecord) => void;
  onViewAll: () => void;
}

export const RecentScreeningsTable: React.FC<RecentScreeningsTableProps> = ({
  records,
  onViewDetails,
  onViewAll,
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Screenings
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Latest completed risk assessments
          </p>
        </div>

        <button
          onClick={onViewAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--primary-burgundy)',
            padding: '0.4rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {records.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FileText size={26} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No recent screenings recorded yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Demographics</th>
                <th>Prediction</th>
                <th>Model Score</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((rec) => {
                const isPos = rec.prediction === 'Positive';
                const dateStr = new Date(rec.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={rec.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{dateStr}</span>
                    </td>
                    <td>
                      <span>
                        {rec.questionnaire?.Age || '—'} yrs &bull; {rec.questionnaire?.Gender || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isPos ? 'badge-positive' : 'badge-negative'}`}>
                        {rec.prediction}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {(rec.model_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onViewDetails(rec)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        title="View Full Record"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
