import React from 'react';
import { Stethoscope } from 'lucide-react';
import type { SymptomStat } from '../types';

interface SymptomSummaryProps {
  symptoms: SymptomStat[];
}

export const SymptomSummary: React.FC<SymptomSummaryProps> = ({ symptoms }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Commonly Reported Symptoms
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Frequency of symptoms flagged as &apos;Yes&apos; across completed screenings
        </p>
      </div>

      {symptoms.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '2rem 1rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          <Stethoscope size={28} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem' }}>No symptom statistics recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {symptoms.slice(0, 6).map((item) => (
            <div key={item.symptom} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.symptom}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong>{item.count}</strong> ({item.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: 'var(--primary-burgundy)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
