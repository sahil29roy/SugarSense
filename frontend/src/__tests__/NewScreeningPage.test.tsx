import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewScreeningPage } from '../pages/NewScreeningPage';
import { api } from '../services/api';
import type { PredictionResult } from '../types';

vi.mock('../services/api', () => ({
  api: {
    predictRisk: vi.fn(),
  },
}));

describe('NewScreeningPage Workflow', () => {
  const mockPredictionResult: PredictionResult = {
    prediction: 'Positive',
    risk_assessment: 'Elevated Risk Detected',
    model_score: 0.98,
    class_probabilities: { Negative: 0.02, Positive: 0.98 },
    disclaimer: 'Educational screening risk estimate only.',
    screening_id: '507f1f77bcf86cd799439011',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 demographics initially with default age and gender controls', () => {
    render(<NewScreeningPage onNavigate={vi.fn()} />);

    expect(screen.getByText('Demographic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Age \(in years\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Male$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Female$/i })).toBeInTheDocument();
  });

  it('validates age field and prevents progression when age is invalid', () => {
    render(<NewScreeningPage onNavigate={vi.fn()} />);

    const ageInput = screen.getByLabelText(/Age \(in years\)/i);

    // Enter out of bounds age
    fireEvent.change(ageInput, { target: { value: '150' } });
    expect(screen.getByText(/Age must be between 1 and 120/i)).toBeInTheDocument();

    // Click next step
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    // Must remain on Demographics step
    expect(screen.getByText('Demographic Information')).toBeInTheDocument();

    // Fix age
    fireEvent.change(ageInput, { target: { value: '52' } });
    expect(screen.queryByText(/Age must be between 1 and 120/i)).not.toBeInTheDocument();

    // Progress to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText('Primary & Osmotic Symptoms')).toBeInTheDocument();
  });

  it('navigates through all 4 steps and submits complete questionnaire', async () => {
    vi.mocked(api.predictRisk).mockResolvedValue(mockPredictionResult);

    render(<NewScreeningPage onNavigate={vi.fn()} />);

    // Step 1: Demographics
    const femaleBtn = screen.getByRole('button', { name: /^Female$/i });
    fireEvent.click(femaleBtn);
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Step 2: Primary Symptoms
    expect(screen.getByText('Primary & Osmotic Symptoms')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Step 3: Secondary Symptoms
    expect(screen.getByText('Secondary & Neuromuscular Indicators')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Step 4: Review and Submit
    expect(screen.getByText('Review Your Information')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit for Screening/i });
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.predictRisk).toHaveBeenCalledTimes(1);
    });

    const callPayload = vi.mocked(api.predictRisk).mock.calls[0][0];
    expect(callPayload.Gender).toBe('Female');
    expect(callPayload.Age).toBe(45);
    expect(callPayload.Polyuria).toBe('No');

    // Should render ScreeningResultView
    await waitFor(() => {
      expect(screen.getByText(/Elevated Risk Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Positive Screening Assessment/i)).toBeInTheDocument();
    });
  });

  it('disables submit button during submission to prevent duplicate requests', async () => {
    // Return a pending promise to simulate in-flight network request
    let resolvePromise: (value: PredictionResult) => void;
    const pendingPromise = new Promise<PredictionResult>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(api.predictRisk).mockReturnValue(pendingPromise);

    render(<NewScreeningPage onNavigate={vi.fn()} />);

    // Fast-forward to step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    const submitBtn = screen.getByRole('button', { name: /Submit for Screening/i });
    fireEvent.click(submitBtn);

    // Button should now be disabled and displaying evaluating model spinner
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Evaluating Model/i)).toBeInTheDocument();

    // Clicking again should not trigger another call
    fireEvent.click(submitBtn);
    expect(api.predictRisk).toHaveBeenCalledTimes(1);

    // Resolve request
    resolvePromise!(mockPredictionResult);

    await waitFor(() => {
      expect(screen.getByText(/Elevated Risk Detected/i)).toBeInTheDocument();
    });
  });

  it('displays API error banner when prediction request fails', async () => {
    vi.mocked(api.predictRisk).mockRejectedValue(new Error('503 Service Unavailable: Database offline'));

    render(<NewScreeningPage onNavigate={vi.fn()} />);

    // Fast-forward to step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    const submitBtn = screen.getByRole('button', { name: /Submit for Screening/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/503 Service Unavailable: Database offline/i)).toBeInTheDocument();
    });
  });
});
