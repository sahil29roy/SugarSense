import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  User,
  X,
} from 'lucide-react';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { api } from '../services/api';
import type { ScreeningRecord } from '../types';

interface ScreeningModalProps {
  screening?: ScreeningRecord | null;
  screeningId?: string | null;
  onClose: () => void;
}

export const ScreeningModal: React.FC<ScreeningModalProps> = ({
  screening: initialScreening = null,
  screeningId = null,
  onClose,
}) => {
  const [screening, setScreening] = useState<ScreeningRecord | null>(initialScreening);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (initialScreening) {
      setScreening(initialScreening);
      setFetchError(null);
    } else if (screeningId) {
      setIsLoading(true);
      setFetchError(null);
      api
        .getScreeningById(screeningId)
        .then((record) => {
          setScreening(record);
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : 'Unable to find or retrieve the specified screening record.';
          setFetchError(msg);
          setScreening(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setScreening(null);
    }
  }, [initialScreening, screeningId]);

  if (!initialScreening && !screeningId) {
    return null;
  }

  const isPositive = screening?.prediction === 'Positive';
  const q = screening?.questionnaire;
  const dateFormatted = screening?.created_at
    ? new Date(screening.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 36, 36, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: isPositive ? 'var(--peach-light)' : 'var(--accent-low-risk-bg)',
                color: isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeartPulse size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Screening Record Details</h3>
                {screening && (
                  <span className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`}>
                    {screening.prediction} Risk
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ID: {screening?.id || screeningId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isLoading ? (
            <LoadingState message="Fetching individual record from database..." minHeight="250px" />
          ) : fetchError ? (
            <ErrorState
              title="Record Lookup Failed"
              message={fetchError}
              onRetry={() => {
                if (screeningId) {
                  setIsLoading(true);
                  setFetchError(null);
                  api
                    .getScreeningById(screeningId)
                    .then(setScreening)
                    .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : 'Record not found'))
                    .finally(() => setIsLoading(false));
                }
              }}
            />
          ) : screening && q ? (
            <>
              {/* Metadata banner */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={15} />
                  <span>{dateFormatted}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <User size={15} />
                  <span>
                    {q.Age} years &bull; {q.Gender}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Clock size={15} />
                  <span>Score: {(screening.model_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Clinical Symptoms Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  Recorded Symptom Responses (14 Features)
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.65rem',
                  }}
                >
                  {Object.entries(q)
                    .filter(([key]) => key !== 'Age' && key !== 'Gender')
                    .map(([symptom, value]) => {
                      const isYes = value === 'Yes';
                      return (
                        <div
                          key={symptom}
                          style={{
                            padding: '0.6rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid',
                            borderColor: isYes ? 'var(--muted-peach)' : 'var(--border-subtle)',
                            backgroundColor: isYes ? 'var(--peach-light)' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {symptom}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: isYes ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                            }}
                          >
                            {String(value)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Assessment & Disclaimer */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isPositive ? 'var(--peach-light)' : 'var(--accent-low-risk-bg)',
                  border: `1px solid ${isPositive ? 'var(--muted-peach)' : 'rgba(56, 132, 71, 0.2)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color={isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)'} />
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: isPositive ? 'var(--dark-burgundy)' : 'var(--accent-low-risk)',
                    }}
                  >
                    {screening.risk_assessment}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {screening.disclaimer ||
                    'SugarSense provides educational symptom-based risk estimates and does not replace medical evaluation.'}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};
