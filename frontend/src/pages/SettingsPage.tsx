import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  Database,
  LayoutDashboard,
  RefreshCw,
  Server,
  Shield,
} from 'lucide-react';
import { api } from '../services/api';
import type { HealthStatus, NavigationTab } from '../types';

interface SettingsPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onRefreshHealth: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onRefreshHealth }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const status = await api.getHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealth(status);
      onRefreshHealth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to SugarSense backend.';
      setError(msg);
      setHealth(null);
      setLatency(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDiagnostics();
  }, []);

  const baseUrl = api.getBaseUrl();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 960, margin: '0 auto' }}>
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
              System Diagnostics & Configuration
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            System Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Verify API communication, live model persistence, MongoDB connectivity, and runtime configurations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={checkDiagnostics}
            disabled={isLoading}
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
            <RefreshCw size={15} className={isLoading ? 'spin-animation' : ''} />
            Ping Backend
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
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
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FDF2F2',
            border: '1px solid var(--primary-burgundy)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-burgundy)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Gateway Connection Warning:</strong> {error}
          </div>
        </div>
      )}

      {/* Connectivity & Health Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Backend API Server */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} color="var(--primary-burgundy)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>FastAPI Gateway</span>
            </div>
            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: health ? 'var(--accent-low-risk-bg)' : '#FDF2F2',
                color: health ? 'var(--accent-low-risk)' : 'var(--primary-burgundy)',
              }}
            >
              {health ? 'Operational' : 'Unreachable'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Base URL</div>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {baseUrl}
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Round-trip Ping: <strong>{latency !== null ? `${latency} ms` : 'N/A'}</strong>
          </div>
        </div>

        {/* ML Inference Pipeline */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={20} color="var(--primary-burgundy)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Decision Tree Pipeline</span>
            </div>
            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: health?.model_loaded ? 'var(--accent-low-risk-bg)' : '#FDF2F2',
                color: health?.model_loaded ? 'var(--accent-low-risk)' : 'var(--primary-burgundy)',
              }}
            >
              {health?.model_loaded ? 'Ready' : 'Not Loaded'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Model Artifact</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {health?.model_name || 'DecisionTreeClassifier'}
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Pipeline: <strong>scikit-learn with StandardScaler + OneHotEncoder</strong>
          </div>
        </div>

        {/* Screening History Storage */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} color="var(--primary-burgundy)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Screening Store</span>
            </div>
            <span
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: health?.database_connected ? 'var(--accent-low-risk-bg)' : '#FEF3C7',
                color: health?.database_connected ? 'var(--accent-low-risk)' : 'var(--accent-warning)',
              }}
            >
              {health?.database_connected ? 'Connected' : 'Degraded (Offline)'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Database Engine</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              MongoDB Community / PyMongo
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Mode: <strong>{health?.database_connected ? 'Active Auditing' : 'Graceful In-Memory Degraded'}</strong>
          </div>
        </div>
      </div>

      {/* Diagnostics Details */}
      <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Environment & Interface Configuration
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Frontend Build Environment</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>React 19 + Vite 6 + TypeScript</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Design System Theme</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>PropelBoard Cream (#F7F0E8) & Burgundy (#861F24)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Backend Framework</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Python 3.14 + FastAPI + Pydantic v2</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Machine Learning Model State</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>DecisionTreeClassifier (Trained on 520 records)</span>
          </div>
        </div>
      </div>

      {/* Educational Notice Card */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--peach-light)',
          border: '1px solid var(--soft-orange)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <Shield size={24} color="var(--primary-burgundy)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Educational Screening Architecture
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
            SugarSense is designed strictly for academic, educational, and preliminary symptom risk evaluation. It does
            not diagnose diabetes mellitus and does not replace medical advice, laboratory blood glucose testing, or
            physician consultation.
          </div>
        </div>
      </div>
    </div>
  );
};
