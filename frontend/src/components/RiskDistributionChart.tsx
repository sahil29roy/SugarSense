import React from 'react';
import { Info } from 'lucide-react';

interface RiskDistributionChartProps {
  positiveCount: number;
  negativeCount: number;
  positivePercentage: number;
  negativePercentage: number;
  total: number;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  positiveCount,
  negativeCount,
  positivePercentage,
  negativePercentage,
  total,
}) => {
  // SVG Donut geometry
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate arc lengths
  const posRatio = total > 0 ? positiveCount / total : 0;
  const negRatio = total > 0 ? negativeCount / total : 0;

  const posStrokeDash = `${posRatio * circumference} ${circumference}`;
  const negStrokeDash = `${negRatio * circumference} ${circumference}`;
  const negOffset = -posRatio * circumference;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Risk Distribution
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Proportion of positive vs negative model estimates
            </p>
          </div>
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '12px solid var(--border-color)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              No Data
            </div>
            <p style={{ fontSize: '0.875rem' }}>No screening records recorded in the database yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Donut Chart SVG */}
            <div style={{ position: 'relative', width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-main)"
                  strokeWidth={strokeWidth}
                />
                {/* Positive (Elevated Risk) Slice */}
                {positiveCount > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="var(--primary-burgundy)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={posStrokeDash}
                    strokeDashoffset={0}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                )}
                {/* Negative (Low Risk) Slice */}
                {negativeCount > 0 && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="var(--accent-low-risk)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={negStrokeDash}
                    strokeDashoffset={negOffset}
                    style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
                  />
                )}
              </svg>

              {/* Center Metrics Text */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {total}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Total
                </span>
              </div>
            </div>

            {/* Legend and Values */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Positive Risk */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--peach-light)',
                  border: '1px solid var(--muted-peach)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary-burgundy)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--dark-burgundy)' }}>
                    Elevated Risk (Positive)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--dark-burgundy)' }}>
                    {positiveCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ({positivePercentage}%)
                  </span>
                </div>
              </div>

              {/* Negative Risk */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-low-risk-bg)',
                  border: '1px solid rgba(56, 132, 71, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--accent-low-risk)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-low-risk)' }}>
                    Low Risk (Negative)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--accent-low-risk)' }}>
                    {negativeCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ({negativePercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer footnote */}
      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.4rem',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          lineHeight: 1.35,
        }}
      >
        <Info size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>Values reflect statistical machine-learning risk predictions, not clinical diabetes diagnoses.</span>
      </div>
    </div>
  );
};
