import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ScreeningHistoryPage } from '../pages/ScreeningHistoryPage';
import { api } from '../services/api';
import type { ScreeningListResponse } from '../types';

vi.mock('../services/api', () => ({
  api: {
    getScreenings: vi.fn(),
    getScreeningById: vi.fn(),
  },
}));

describe('ScreeningHistoryPage', () => {
  const mockScreeningsResponse: ScreeningListResponse = {
    items: [
      {
        id: '507f1f77bcf86cd799439011',
        created_at: '2026-10-29T10:00:00Z',
        questionnaire: {
          Age: 45,
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
        model_score: 0.92,
        class_probabilities: { Negative: 0.08, Positive: 0.92 },
      },
      {
        id: '608a2a88bcf86cd799439012',
        created_at: '2026-10-29T11:00:00Z',
        questionnaire: {
          Age: 32,
          Gender: 'Female',
          Polyuria: 'No',
          Polydipsia: 'No',
          'sudden weight loss': 'No',
          weakness: 'No',
          Polyphagia: 'No',
          'Genital thrush': 'No',
          'visual blurring': 'No',
          Itching: 'No',
          Irritability: 'No',
          'delayed healing': 'No',
          'partial paresis': 'No',
          'muscle stiffness': 'No',
          Alopecia: 'No',
          Obesity: 'No',
        },
        prediction: 'Negative',
        risk_assessment: 'Low Risk Detected',
        model_score: 0.05,
        class_probabilities: { Negative: 0.95, Positive: 0.05 },
      },
    ],
    total: 2,
    limit: 10,
    offset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders history table with records and pagination footer', async () => {
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreeningsResponse);

    render(<ScreeningHistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Screening History')).toBeInTheDocument();
    });

    expect(screen.getByText(/#507f1f77.../i)).toBeInTheDocument();
    expect(screen.getByText(/45 yrs, Male/i)).toBeInTheDocument();
    expect(screen.getByText(/32 yrs, Female/i)).toBeInTheDocument();
    expect(screen.getByText(/Showing Page 1 of 1/i)).toBeInTheDocument();
  });

  it('filters records by risk category', async () => {
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreeningsResponse);

    render(<ScreeningHistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/45 yrs, Male/i)).toBeInTheDocument();
    });

    // Filter by Low Risk only
    fireEvent.click(screen.getByRole('button', { name: /Low Risk \(Negative\)/i }));

    expect(screen.queryByText(/45 yrs, Male/i)).not.toBeInTheDocument();
    expect(screen.getByText(/32 yrs, Female/i)).toBeInTheDocument();

    // Reset to All Records
    fireEvent.click(screen.getByRole('button', { name: /All Records/i }));
    expect(screen.getByText(/45 yrs, Male/i)).toBeInTheDocument();
    expect(screen.getByText(/32 yrs, Female/i)).toBeInTheDocument();
  });

  it('opens details modal when clicking details on a row', async () => {
    vi.mocked(api.getScreenings).mockResolvedValue(mockScreeningsResponse);

    render(<ScreeningHistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/45 yrs, Male/i)).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByRole('button', { name: /Details/i });
    fireEvent.click(detailsButtons[0]);

    // Modal should open
    expect(screen.getByText('Screening Record Details')).toBeInTheDocument();
    expect(screen.getByText('Recorded Symptom Responses (14 Features)')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Close Record/i }));
    expect(screen.queryByText('Screening Record Details')).not.toBeInTheDocument();
  });

  it('renders empty state when no records exist', async () => {
    vi.mocked(api.getScreenings).mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    render(<ScreeningHistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/No Screening Records/i)).toBeInTheDocument();
    });
  });

  it('renders error state when API call fails and provides retry', async () => {
    vi.mocked(api.getScreenings).mockRejectedValueOnce(new Error('Database unavailable'));

    render(<ScreeningHistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to Load Screening History/i)).toBeInTheDocument();
    });

    vi.mocked(api.getScreenings).mockResolvedValue(mockScreeningsResponse);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText(/45 yrs, Male/i)).toBeInTheDocument();
    });
  });
});
