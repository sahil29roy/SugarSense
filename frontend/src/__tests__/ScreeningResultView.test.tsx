import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScreeningResultView } from '../pages/ScreeningResultView';
import type { PredictionResult, QuestionnaireData } from '../types';

describe('ScreeningResultView', () => {
  const mockQuestionnaire: QuestionnaireData = {
    Age: 50,
    Gender: 'Male',
    Polyuria: 'Yes',
    Polydipsia: 'Yes',
    'sudden weight loss': 'No',
    weakness: 'Yes',
    Polyphagia: 'No',
    'Genital thrush': 'No',
    'visual blurring': 'No',
    Itching: 'No',
    Irritability: 'Yes',
    'delayed healing': 'No',
    'partial paresis': 'No',
    'muscle stiffness': 'No',
    Alopecia: 'No',
    Obesity: 'Yes',
  };

  const positiveResult: PredictionResult = {
    prediction: 'Positive',
    risk_assessment: 'Elevated Risk Detected',
    model_score: 0.94,
    class_probabilities: { Negative: 0.06, Positive: 0.94 },
    disclaimer: 'Educational screening risk estimate only.',
    screening_id: '507f1f77bcf86cd799439011',
  };

  const negativeResult: PredictionResult = {
    prediction: 'Negative',
    risk_assessment: 'Low Risk Detected',
    model_score: 0.08,
    class_probabilities: { Negative: 0.92, Positive: 0.08 },
    disclaimer: 'Educational screening risk estimate only.',
    screening_id: '507f1f77bcf86cd799439012',
  };

  it('renders elevated risk result with score and recommendations', () => {
    const onRestart = vi.fn();
    const onNavigate = vi.fn();

    render(
      <ScreeningResultView
        result={positiveResult}
        questionnaire={mockQuestionnaire}
        onRestart={onRestart}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText('Elevated Risk Detected')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument(); // Score percentage
    expect(screen.getByText(/Educational screening risk estimate only/i)).toBeInTheDocument();

    // Check actions
    fireEvent.click(screen.getByRole('button', { name: /View Screening History/i }));
    expect(onNavigate).toHaveBeenCalledWith('history');

    fireEvent.click(screen.getByRole('button', { name: /Start Another Screening/i }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('renders low risk result with appropriate reassurance and guidance', () => {
    render(
      <ScreeningResultView
        result={negativeResult}
        questionnaire={mockQuestionnaire}
        onRestart={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText('Low Risk Detected')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText(/Maintaining healthy nutrition/i)).toBeInTheDocument();
  });
});
