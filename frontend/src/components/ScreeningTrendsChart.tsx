import React from 'react';
import { Calendar } from 'lucide-react';
import type { ScreeningRecord } from '../types';

interface ScreeningTrendsChartProps {
  records: ScreeningRecord[];
}

export const ScreeningTrendsChart: React.FC<ScreeningTrendsChartProps> = ({ records }) => {
  // Aggregate records by day (last 7 recorded days or up to 7 distinct dates)
  const dateMap = new Map<string, { label: string; positive: number; negative: number; total: number }>();

  // Process chronological order
  const sorted = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sorted.forEach((rec) => {
    const d = new Date(rec.created_at);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!dateMap.has(key)) {
      dateMap.set(key, { label, positive: 0, negative: 0, total: 0 });
    }
    const entry = dateMap.get(key)!;
    if (rec.prediction === 'Positive') {
      entry.positive += 1;
    } else {
      entry.negative += 1;
    }
    entry.total += 1;
  });

  const dataPoints = Array.from(dateMap.values()).slice(-7);
  const maxTotal = Math.max(...dataPoints.map((p) => p.total), 5);

  const chartHeight = 180;
  const barWidth = 32;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Screening Activity Trends
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Daily screening volume and risk breakdown from actual database records
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary-burgundy)' }} />
            <span>Elevated Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-low-risk)' }} />
            <span>Low Risk</span>
          </div>
        </div>
      </div>

      {dataPoints.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            minHeight: chartHeight,
          }}
        >
          <Calendar size={28} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No historical trend data available yet.</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          {/* Bar Chart Container */}
          <div
            style={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem',
              gap: '0.5rem',
            }}
          >
            {dataPoints.map((dp, i) => {
              const posHeight = Math.round((dp.positive / maxTotal) * (chartHeight - 30));
              const negHeight = Math.round((dp.negative / maxTotal) * (chartHeight - 30));

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flex: 1,
                    maxWidth: 60,
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {dp.total}
                  </span>
                  <div
                    style={{
                      width: barWidth,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {dp.positive > 0 && (
                      <div
                        title={`Elevated Risk: ${dp.positive}`}
                        style={{
                          height: Math.max(posHeight, 6),
                          backgroundColor: 'var(--primary-burgundy)',
                          transition: 'height 0.4s ease',
                        }}
                      />
                    )}
                    {dp.negative > 0 && (
                      <div
                        title={`Low Risk: ${dp.negative}`}
                        style={{
                          height: Math.max(negHeight, 6),
                          backgroundColor: 'var(--accent-low-risk)',
                          transition: 'height 0.4s ease',
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {dp.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
