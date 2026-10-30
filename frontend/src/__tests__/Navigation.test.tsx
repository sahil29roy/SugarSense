import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getHealth: vi.fn(),
    getStats: vi.fn(),
    getScreenings: vi.fn(),
    getModelInfo: vi.fn(),
    getBaseUrl: vi.fn().mockReturnValue('http://127.0.0.1:8000'),
  },
}));

describe('App Navigation and Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.getHealth).mockResolvedValue({
      status: 'healthy',
      service: 'sugarsense-backend',
      model_loaded: true,
      model_name: 'Decision Tree',
      database_connected: true,
    });

    vi.mocked(api.getStats).mockResolvedValue({
      total_screenings: 10,
      positive_predictions: 6,
      negative_predictions: 4,
      positive_percentage: 60,
      negative_percentage: 40,
      top_reported_symptoms: [],
      disclaimer: 'Disclaimer',
    });

    vi.mocked(api.getScreenings).mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    vi.mocked(api.getModelInfo).mockResolvedValue({
      model_name: 'Decision Tree',
      target_classes: ['Negative', 'Positive'],
      features: ['Age', 'Gender', 'Polyuria'],
      metrics: {
        test_metrics: {
          accuracy: 0.9904,
          recall_positive: 0.9844,
          precision_positive: 1.0,
          f1_positive: 0.9921,
        },
      },
      dataset_summary: {
        total_rows: 520,
        train_rows: 416,
        test_rows: 104,
        train_test_split_ratio: '80/20',
      },
      disclaimer: 'Model disclaimer.',
    });
  });

  it('renders default Dashboard view with active navigation link', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to SugarSense')).toBeInTheDocument();
    });

    // Check sidebar brand
    expect(screen.getByText('SugarSense')).toBeInTheDocument();
  });

  it('navigates through sidebar items', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to SugarSense')).toBeInTheDocument();
    });

    // Navigate to Insights
    fireEvent.click(screen.getByRole('button', { name: /Insights/i }));
    await waitFor(() => {
      expect(screen.getByText('Algorithmic Insights')).toBeInTheDocument();
    });

    // Navigate to Reports
    fireEvent.click(screen.getByRole('button', { name: /Reports/i }));
    await waitFor(() => {
      expect(screen.getByText('Executive Screening Report')).toBeInTheDocument();
    });

    // Navigate to Settings
    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });
  });

  it('triggers search on topbar and switches to history tab', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to SugarSense')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search screening ID, symptoms, or status/i);
    fireEvent.change(searchInput, { target: { value: 'Male' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Screening History', level: 1 })).toBeInTheDocument();
    });
  });
});
