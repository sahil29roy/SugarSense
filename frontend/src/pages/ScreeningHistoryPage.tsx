import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ScreeningModal } from '../components/ScreeningModal';
import { api } from '../services/api';
import type { NavigationTab, PredictionClass, ScreeningRecord } from '../types';

interface ScreeningHistoryPageProps {
  onNavigate: (tab: NavigationTab) => void;
  initialSearchQuery?: string;
}

export const ScreeningHistoryPage: React.FC<ScreeningHistoryPageProps> = ({
  onNavigate,
  initialSearchQuery = '',
}) => {
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [filterClass, setFilterClass] = useState<'All' | PredictionClass>('All');
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);

  const fetchRecords = async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (targetPage - 1) * pageSize;
      const res = await api.getScreenings(pageSize, offset);
      setRecords(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve screening history.';
      setError(msg);
      setRecords([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Client-side filtering on current page records or search matches
  const filteredRecords = records.filter((rec) => {
    // Prediction Filter
    if (filterClass !== 'All' && rec.prediction !== filterClass) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchId = rec.id.toLowerCase().includes(q);
      const matchAge = rec.questionnaire.Age.toString().includes(q);
      const matchGender = rec.questionnaire.Gender.toLowerCase().includes(q);
      const matchPrediction = rec.prediction.toLowerCase().includes(q);
      return matchId || matchAge || matchGender || matchPrediction;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
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
              Auditable Records
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Screening History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Browse and review stored diabetes symptom screenings performed in your database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => fetchRecords(page)}
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
            Refresh
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

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.875rem',
            gap: '0.5rem',
            flex: '1 1 300px',
            maxWidth: 400,
          }}
        >
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, age, or gender..."
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '0.875rem',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Result Filter:
          </span>
          {(['All', 'Positive', 'Negative'] as const).map((filterOpt) => {
            const isSelected = filterClass === filterOpt;
            return (
              <button
                key={filterOpt}
                type="button"
                onClick={() => setFilterClass(filterOpt)}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${isSelected ? 'var(--primary-burgundy)' : 'var(--border-color)'}`,
                  backgroundColor: isSelected ? 'var(--primary-burgundy)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {filterOpt === 'All'
                  ? 'All Records'
                  : filterOpt === 'Positive'
                  ? 'Elevated Risk (Positive)'
                  : 'Low Risk (Negative)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="card" style={{ padding: '3rem' }}>
          <LoadingState message="Loading historical screening records..." />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem' }}>
          <ErrorState
            title="Unable to Load Screening History"
            message={error}
            onRetry={() => fetchRecords(page)}
          />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: '3rem' }}>
          <EmptyState
            title={records.length === 0 ? 'No Screening Records' : 'No Matching Results'}
            description={
              records.length === 0
                ? 'No educational diabetes screenings have been conducted yet. Complete your first questionnaire to establish an auditable history.'
                : 'No stored screenings match your current filter or search criteria.'
            }
            actionText="Start New Screening"
            onAction={() => onNavigate('new-screening')}
          />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Record ID
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Date & Time
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Demographics
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Model Classification
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Model Score
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => {
                  const isPositive = item.prediction === 'Positive';
                  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Record ID */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        #{item.id.slice(0, 8)}...
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={14} color="var(--text-secondary)" />
                          {formattedDate}
                        </div>
                      </td>

                      {/* Demographics */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {item.questionnaire.Age} yrs, {item.questionnaire.Gender}
                      </td>

                      {/* Prediction Tag */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isPositive ? 'var(--peach-light)' : 'var(--accent-low-risk-bg)',
                            color: isPositive ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)',
                          }}
                        >
                          {isPositive ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          {isPositive ? 'Elevated Risk' : 'Low Risk'}
                        </span>
                      </td>

                      {/* Model Score */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {(item.model_score * 100).toFixed(0)}% confidence
                      </td>

                      {/* Action */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--text-primary)',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-main)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total stored screenings)
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page <= 1 || isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: page <= 1 ? 'transparent' : '#FFFFFF',
                  color: page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages || isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: page >= totalPages ? 'transparent' : '#FFFFFF',
                  color: page >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <ScreeningModal
          screening={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
