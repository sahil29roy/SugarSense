import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { NavigationTab, PredictionResult, QuestionnaireData } from '../types';

interface ScreeningResultViewProps {
  result: PredictionResult;
  questionnaire: QuestionnaireData;
  onRestart: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ScreeningResultView: React.FC<ScreeningResultViewProps> = ({
  result,
  questionnaire,
  onRestart,
  onNavigate,
}) => {
  const isPositive = result.prediction === 'Positive';
  const scorePercent = (result.model_score * 100).toFixed(0);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner / Assessment Card */}
      <div
        className="card"
        style={{
          borderTop: `6px solid ${isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)'}`,
          padding: '2.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: isPositive ? 'var(--peach-light)' : 'var(--accent-low-risk-bg)',
            color: isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPositive ? <AlertTriangle size={38} /> : <CheckCircle2 size={38} />}
        </div>

        <div>
          <span className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`} style={{ marginBottom: '0.5rem' }}>
            {result.prediction} Screening Assessment
          </span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {result.risk_assessment}
          </h2>
          <p style={{ maxWidth: 540, margin: '0.5rem auto 0', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {isPositive
              ? 'Based on your reported symptoms and empirical clinical patterns, potential diabetes risk indicators were identified. A medical evaluation is recommended.'
              : 'Based on your reported symptoms, no strong risk indicators were identified. Maintaining healthy nutrition and regular checkups is always encouraged.'}
          </p>
        </div>

        {/* Model Score & Probabilities Widget */}
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Statistical Model Risk Score
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)' }}>
              {scorePercent}%
            </span>
          </div>

          <div
            style={{
              height: 10,
              backgroundColor: 'var(--border-color)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${scorePercent}%`,
                backgroundColor: isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Low Risk (Negative): {((result.class_probabilities?.Negative || 0) * 100).toFixed(0)}%</span>
            <span>Elevated Risk (Positive): {((result.class_probabilities?.Positive || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {result.screening_id && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span>Record Persisted to History</span>
            <span style={{ fontWeight: 600 }}>ID: {result.screening_id}</span>
          </div>
        )}
      </div>

      {/* Summary of Reported Symptoms */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Summary of Your Responses
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Age: <strong>{questionnaire.Age}</strong> &bull; Gender: <strong>{questionnaire.Gender}</strong>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {Object.entries(questionnaire)
            .filter(([k]) => k !== 'Age' && k !== 'Gender')
            .map(([symptom, val]) => {
              const isYes = val === 'Yes';
              return (
                <div
                  key={symptom}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isYes ? 'var(--muted-peach)' : 'var(--border-subtle)',
                    backgroundColor: isYes ? 'var(--peach-light)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{symptom}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isYes ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                    }}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Reassuring Educational Disclaimer */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--peach-light)',
          border: '1px solid var(--muted-peach)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
        }}
      >
        <ShieldAlert size={22} style={{ color: 'var(--primary-burgundy)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--dark-burgundy)' }}>
            Educational Notice &amp; Next Steps
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {result.disclaimer}
          </p>
        </div>
      </div>

      {/* Navigation and Action buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button onClick={onRestart} className="btn-primary" style={{ padding: '0.8rem 1.4rem' }}>
          <RefreshCw size={16} />
          <span>Start Another Screening</span>
        </button>

        <button onClick={() => onNavigate('history')} className="btn-secondary" style={{ padding: '0.8rem 1.4rem' }}>
          <FileText size={16} />
          <span>View Screening History</span>
        </button>

        <button onClick={() => onNavigate('dashboard')} className="btn-secondary" style={{ padding: '0.8rem 1.4rem' }}>
          <HeartPulse size={16} />
          <span>Return to Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
