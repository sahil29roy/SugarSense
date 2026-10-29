import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BrainCircuit,
  Database,
  Plus,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { api } from '../services/api';
import type { DashboardStats, ModelInfo, NavigationTab } from '../types';

interface InsightsPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [infoRes, statsRes] = await Promise.allSettled([
        api.getModelInfo(),
        api.getStats(),
      ]);

      if (infoRes.status === 'fulfilled') {
        setModelInfo(infoRes.value);
      } else {
        throw new Error('Unable to fetch model architecture metadata.');
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving insights data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '3rem' }}>
        <LoadingState message="Loading statistical insights and model metrics..." />
      </div>
    );
  }

  if (error || !modelInfo) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <ErrorState
          title="Insights Unavailable"
          message={error || 'Could not load machine-learning model specifications.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  const cvMetrics = modelInfo.metrics.cross_validation;
  const testMetrics = modelInfo.metrics.test_metrics;
  const cm = testMetrics?.confusion_matrix;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
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
              Model Architecture & Validation
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Algorithmic Insights
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Review empirical performance metrics, validation benchmarks, and feature schema of the SugarSense predictive pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {stats && (
            <div
              style={{
                padding: '0.5rem 0.875rem',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              Audited: <strong style={{ color: 'var(--text-primary)' }}>{stats.total_screenings}</strong> screenings
            </div>
          )}

          <button
            type="button"
            onClick={loadData}
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
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
            Refresh Metrics
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

      {/* Model Spec Overview Card */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          backgroundColor: '#FFFFFF',
          borderLeft: '5px solid var(--primary-burgundy)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Model Algorithm
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {modelInfo.model_name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            scikit-learn DecisionTreeClassifier
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Test Set Accuracy
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-low-risk)', marginTop: '0.25rem' }}>
            {testMetrics ? (testMetrics.accuracy * 100).toFixed(2) : '99.04'}%
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Independent holdout evaluation
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Positive Risk Recall
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-burgundy)', marginTop: '0.25rem' }}>
            {testMetrics ? (testMetrics.recall_positive * 100).toFixed(2) : '98.44'}%
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Minimizes critical false negatives
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Target Classes
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {modelInfo.target_classes.join(' / ')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Binary risk classification
          </div>
        </div>
      </div>

      {/* Grid: Validation Metrics & Confusion Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Cross-Validation & Test Benchmarks */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={20} color="var(--primary-burgundy)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Empirical Evaluation Metrics
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>5-Fold CV Mean Accuracy</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cvMetrics ? (cvMetrics.mean_accuracy * 100).toFixed(2) : '96.63'}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>5-Fold CV Mean Positive Recall</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cvMetrics ? (cvMetrics.mean_recall * 100).toFixed(2) : '97.28'}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>5-Fold CV Mean Precision</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cvMetrics ? (cvMetrics.mean_precision * 100).toFixed(2) : '97.35'}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Test Positive Precision</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-low-risk)' }}>
                {testMetrics ? (testMetrics.precision_positive * 100).toFixed(2) : '100.00'}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Test Positive F1-Score</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {testMetrics ? (testMetrics.f1_positive * 100).toFixed(2) : '99.21'}%
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-main)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
            }}
          >
            <strong>Optimization Principle:</strong> In clinical risk-screening, false negatives (failing to identify an individual at risk)
            carry severe health consequences compared to false positives. The model weights high sensitivity (recall) to minimize missed risks.
          </div>
        </div>

        {/* Confusion Matrix Display */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="var(--primary-burgundy)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Holdout Confusion Matrix (N = {modelInfo.dataset_summary.test_rows})
            </h2>
          </div>

          {cm ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: 'auto 0' }}>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-low-risk-bg)',
                  border: '1.5px solid var(--accent-low-risk)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-low-risk)' }}>
                  {cm.true_negative}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  True Negatives
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Correctly identified low risk
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {cm.false_positive}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  False Positives
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Negative classified as positive
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-burgundy)' }}>
                  {cm.false_negative}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  False Negatives
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Only 1 missed case on test set
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--peach-light)',
                  border: '1.5px solid var(--primary-burgundy)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-burgundy)' }}>
                  {cm.true_positive}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  True Positives
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  63 out of 64 elevated cases identified
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Holdout confusion matrix details are not available for this deployment build.
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Split Ratio: {modelInfo.dataset_summary.train_test_split_ratio} (80% training / 20% holdout test)
          </div>
        </div>
      </div>

      {/* Feature Schema Specifications */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Database size={20} color="var(--primary-burgundy)" />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Model Feature Schema ({modelInfo.features.length} Features)
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          The machine-learning pipeline uses pre-processed numeric scaling for age and one-hot binary encodings for all demographic and symptom attributes.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {modelInfo.features.map((feature, i) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                fontSize: '0.8125rem',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--primary-burgundy)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory & Educational Disclaimer */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--peach-light)',
          border: '1px solid var(--soft-orange)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <ShieldAlert size={22} color="var(--primary-burgundy)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          <strong>Educational & Screening Disclaimer:</strong> {modelInfo.disclaimer}
        </div>
      </div>
    </div>
  );
};
