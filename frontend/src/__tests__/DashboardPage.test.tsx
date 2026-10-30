import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardPage } from '../pages/DashboardPage';
import { api } from '../services/api';
import type { DashboardStats, ScreeningListResponse } from '../types';

vi.mock('../services/api', () => ({
  api: {
    getStats: vi.fn(),
    getScreenings: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  const mockStats: DashboardStats = {
    total_screenings: 25,
    positive_predictions: 15,
    negative_predictions: 10,
    positive_percentage: 60.0,
    negative_percentage: 40.0,
    top_reported_symptoms: [
      { symptom: 'Polyuria', count: 18, percentage: 72.0 },
      { symptom: 'Polydipsia', count: 14, percentage: 56.0 },
    ],
    disclaimer: 'Educational statistics from application records.',
  };

  const mockScreenings: ScreeningListResponse = {
    items: [
      {
        id: '507f1f77bcf86cd799439011',
        created_at: '2026-10-29T12:00:00Z',
        questionnaire: {
          Age: 48,
          Gender: 'Male',
          Polyuria: 'Yes',
          Polydipsia: 'Yes',
          'sudden weight loss': 'No',
          weakness: 'Yes',
          Polyphagia: 'No',
          'Genital thrush': 'No',
          'visual blurring': 'Yes',
          Itching: 'No',
          Irritability: 'Yes',
          'delayed healing': 'No',
          'partial paresis': 'No',
          'muscle stiffness': 'No',
          Alopecia: 'Yes',
          Obesity: 'No',
        },
        prediction: 'Positive',
        risk_assessment: 'Elevated Risk Detected',
        model_score: 0.95,
        class_probabilities: { Negative: 0.05, Positive: 0.95 },
      },
    ],
    total: 1,
    limit: 10,
    offset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.getStats).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getScreenings).mockReturnValue(new Promise(() => {}));

    render(<DashboardPage onNavigate={vi.fn()} />);
    expect(screen.getByText(/Loading SugarSense screening dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard with stats and recent screening records', async () => {
    vi.mocked(api.getStats).mockResolvedValue(mockStats);
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreenings);

    render(<DashboardPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to SugarSense/i)).toBeInTheDocument();
    });

    // Check KPI summary cards
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);

    // Check symptom list
    expect(screen.getAllByText('Polyuria').length).toBeGreaterThanOrEqual(1);

    // Check recent records
    expect(screen.getByText(/48 yrs/i)).toBeInTheDocument();
    expect(screen.getByText('Elevated Risk')).toBeInTheDocument();
  });

  it('handles empty database state gracefully', async () => {
    vi.mocked(api.getStats).mockResolvedValue({
      total_screenings: 0,
      positive_predictions: 0,
      negative_predictions: 0,
      positive_percentage: 0,
      negative_percentage: 0,
      top_reported_symptoms: [],
      disclaimer: 'No records available.',
    });
    vi.mocked(api.getScreenings).mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    render(<DashboardPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to SugarSense/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/No recent screenings recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/No symptom statistics recorded yet/i)).toBeInTheDocument();
  });

  it('navigates to new screening workflow when clicking start screening', async () => {
    vi.mocked(api.getStats).mockResolvedValue(mockStats);
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreenings);
    const mockNavigate = vi.fn();

    render(<DashboardPage onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to SugarSense/i)).toBeInTheDocument();
    });

    const startButtons = screen.getAllByRole('button', { name: /Start New Screening/i });
    fireEvent.click(startButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('new-screening');
  });

  it('renders error state and retries on failure', async () => {
    vi.mocked(api.getStats).mockRejectedValueOnce(new Error('Gateway error: Connection refused'));
    vi.mocked(api.getScreenings).mockRejectedValueOnce(new Error('Gateway error: Connection refused'));

    render(<DashboardPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Gateway error: Connection refused/i)).toBeInTheDocument();
    });

    // Verify retry button calls api again
    vi.mocked(api.getStats).mockResolvedValue(mockStats);
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreenings);

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to SugarSense/i)).toBeInTheDocument();
    });
  });
});
