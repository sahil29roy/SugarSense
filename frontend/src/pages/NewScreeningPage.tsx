import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  Info,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import type { NavigationTab, PredictionResult, QuestionnaireData, YesNo } from '../types';
import { ScreeningResultView } from './ScreeningResultView';

interface NewScreeningPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

interface SymptomMeta {
  key: keyof Omit<QuestionnaireData, 'Age' | 'Gender'>;
  label: string;
  description: string;
  category: 'primary' | 'secondary';
}

const SYMPTOM_LIST: SymptomMeta[] = [
  // Primary / Classic Osmotic & Metabolic Symptoms
  {
    key: 'Polyuria',
    label: 'Frequent Urination (Polyuria)',
    description: 'Needing to urinate significantly more often than usual, especially waking up multiple times at night.',
    category: 'primary',
  },
  {
    key: 'Polydipsia',
    label: 'Excessive Thirst (Polydipsia)',
    description: 'A constant, unquenchable feeling of intense thirst even after drinking plenty of fluids.',
    category: 'primary',
  },
  {
    key: 'sudden weight loss',
    label: 'Sudden Unexplained Weight Loss',
    description: 'Rapid or noticeable drop in body weight without dieting, exercise, or intentional lifestyle changes.',
    category: 'primary',
  },
  {
    key: 'Polyphagia',
    label: 'Excessive Hunger (Polyphagia)',
    description: 'Persistent, intense hunger or cravings even immediately after eating complete meals.',
    category: 'primary',
  },
  {
    key: 'weakness',
    label: 'Generalized Weakness & Fatigue',
    description: 'Exhaustion, lethargy, or marked low energy that does not improve after normal rest or sleep.',
    category: 'primary',
  },
  {
    key: 'visual blurring',
    label: 'Blurry or Fluctuating Vision',
    description: 'Difficulty focusing or transient fuzzy vision caused by osmotic fluid shifts in the lens of the eye.',
    category: 'primary',
  },
  {
    key: 'Genital thrush',
    label: 'Genital Thrush / Yeast Infections',
    description: 'Recurrent fungal or yeast infections and irritation promoted by elevated glucose levels.',
    category: 'primary',
  },

  // Secondary / Dermatologic, Neuromuscular & Systemic Symptoms
  {
    key: 'Itching',
    label: 'Persistent Itching (Pruritus)',
    description: 'Generalized itchy or dry skin, particularly around the lower extremities or genital area.',
    category: 'secondary',
  },
  {
    key: 'Irritability',
    label: 'Irritability & Mood Fluctuations',
    description: 'Unusual restlessness, rapid mood swings, or frustration associated with fluctuating blood sugar.',
    category: 'secondary',
  },
  {
    key: 'delayed healing',
    label: 'Delayed Wound Healing',
    description: 'Cuts, scrapes, bruises, or minor infections that take unusually long to recover.',
    category: 'secondary',
  },
  {
    key: 'partial paresis',
    label: 'Partial Paresis / Muscle Weakness',
    description: 'Mild motor weakness, numbness, or tingling sensations in limbs or extremities.',
    category: 'secondary',
  },
  {
    key: 'muscle stiffness',
    label: 'Muscle Stiffness',
    description: 'Noticeable tightness, cramping, or reduced joint flexibility upon waking or after resting.',
    category: 'secondary',
  },
  {
    key: 'Alopecia',
    label: 'Hair Thinning or Hair Loss (Alopecia)',
    description: 'Noticeable thinning or patches of hair loss linked to metabolic or circulatory changes.',
    category: 'secondary',
  },
  {
    key: 'Obesity',
    label: 'Obesity (BMI ≥ 30)',
    description: 'Carrying excess body weight or high body mass index associated with metabolic insulin resistance.',
    category: 'secondary',
  },
];

const INITIAL_FORM: QuestionnaireData = {
  Age: 45,
  Gender: 'Male',
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
};

const STEPS = [
  { id: 1, title: 'Demographics', subtitle: 'Age & Gender' },
  { id: 2, title: 'Primary Symptoms', subtitle: 'Metabolic & Osmotic' },
  { id: 3, title: 'Secondary Symptoms', subtitle: 'Physical & Neuromuscular' },
  { id: 4, title: 'Review & Submit', subtitle: 'Verify & Screen' },
];

export const NewScreeningPage: React.FC<NewScreeningPageProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireData>(INITIAL_FORM);
  const [ageInput, setAgeInput] = useState<string>('45');
  const [ageError, setAgeError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // Handle Age change and validation
  const handleAgeChange = (val: string) => {
    setAgeInput(val);
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setAgeError('Please enter a valid age.');
    } else if (num < 1 || num > 120) {
      setAgeError('Age must be between 1 and 120 years.');
    } else {
      setAgeError(null);
      setFormData((prev) => ({ ...prev, Age: num }));
    }
  };

  const handleSymptomToggle = (key: keyof Omit<QuestionnaireData, 'Age' | 'Gender'>, val: YesNo) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const num = parseInt(ageInput, 10);
      if (isNaN(num) || num < 1 || num > 120) {
        setAgeError('Please provide a valid age between 1 and 120.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await api.predictRisk(formData);
      setPredictionResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Screening request failed. Please check backend connection.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setFormData(INITIAL_FORM);
    setAgeInput('45');
    setAgeError(null);
    setPredictionResult(null);
    setCurrentStep(1);
    setSubmitError(null);
  };

  // If we already have a prediction result, display the ScreeningResultView
  if (predictionResult) {
    return (
      <ScreeningResultView
        result={predictionResult}
        questionnaire={formData}
        onRestart={handleRestart}
        onNavigate={onNavigate}
      />
    );
  }

  const primarySymptoms = SYMPTOM_LIST.filter((s) => s.category === 'primary');
  const secondarySymptoms = SYMPTOM_LIST.filter((s) => s.category === 'secondary');

  const positiveSymptomCount = Object.entries(formData).filter(
    ([k, v]) => k !== 'Age' && k !== 'Gender' && v === 'Yes'
  ).length;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--primary-burgundy)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Symptom-Based Risk Screening
          </span>
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          New Health Screening
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>
          Answer a series of symptom questions to assess your risk factors using our trained machine learning model.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isActive || isDone ? 1 : 0.5,
                }}
                onClick={() => {
                  if (isDone) setCurrentStep(step.id);
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: isActive
                      ? 'var(--primary-burgundy)'
                      : isDone
                      ? 'var(--accent-low-risk)'
                      : 'var(--border-color)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 0 4px var(--peach-light)' : 'none',
                  }}
                >
                  {isDone ? <Check size={18} /> : step.id}
                </div>
                <div style={{ display: 'none', minWidth: 0 }} className="stepper-text">
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--primary-burgundy)' : 'var(--text-primary)',
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    {step.subtitle}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: isDone ? 'var(--accent-low-risk)' : 'var(--border-color)',
                    margin: '0 1rem',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content Card */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '2rem' }}>
          {/* STEP 1: Demographics */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User size={20} color="var(--primary-burgundy)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Demographic Information
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Age and biological gender are key factors influencing diabetes incidence and baseline screening risks.
                </p>
              </div>

              {/* Age Input */}
              <div>
                <label
                  htmlFor="age-input"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Age (in years) <span style={{ color: 'var(--primary-burgundy)' }}>*</span>
                </label>
                <div style={{ maxWidth: 320 }}>
                  <input
                    id="age-input"
                    type="number"
                    min="1"
                    max="120"
                    value={ageInput}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    placeholder="e.g. 45"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${ageError ? 'var(--primary-burgundy)' : 'var(--border-color)'}`,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  {ageError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        color: 'var(--primary-burgundy)',
                        fontSize: '0.8125rem',
                        marginTop: '0.375rem',
                      }}
                    >
                      <AlertCircle size={14} />
                      {ageError}
                    </div>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Dataset typical range: 16 to 90 years.
                  </span>
                </div>
              </div>

              {/* Gender Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Biological Gender <span style={{ color: 'var(--primary-burgundy)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', maxWidth: 400 }}>
                  {(['Male', 'Female'] as const).map((g) => {
                    const isSelected = formData.Gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, Gender: g }))}
                        style={{
                          flex: 1,
                          padding: '0.875rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--primary-burgundy)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--peach-light)' : '#FFFFFF',
                          color: isSelected ? 'var(--primary-burgundy)' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Check size={16} />}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative Note */}
              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  border: '1px solid var(--border-color)',
                }}
              >
                <Info size={18} color="var(--primary-burgundy)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The SugarSense predictive model accounts for distinct symptom presentations observed across age
                  brackets and genders in peer-reviewed clinical research.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Primary Symptoms */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <Activity size={20} color="var(--primary-burgundy)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Primary & Osmotic Symptoms
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Please indicate whether you have experienced any of the following 7 hallmark indicators in recent months.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {primarySymptoms.map((symptom) => {
                  const currentValue = formData[symptom.key];
                  return (
                    <div
                      key={symptom.key}
                      style={{
                        padding: '1.125rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: currentValue === 'Yes' ? 'var(--peach-light)' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {symptom.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {symptom.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['No', 'Yes'] as const).map((choice) => {
                          const isPicked = currentValue === choice;
                          const isYes = choice === 'Yes';
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleSymptomToggle(symptom.key, choice)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${
                                  isPicked
                                    ? isYes
                                      ? 'var(--primary-burgundy)'
                                      : 'var(--accent-low-risk)'
                                    : 'var(--border-color)'
                                }`,
                                backgroundColor: isPicked
                                  ? isYes
                                    ? 'var(--primary-burgundy)'
                                    : 'var(--accent-low-risk)'
                                  : '#FFFFFF',
                                color: isPicked ? '#FFFFFF' : 'var(--text-secondary)',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Secondary Symptoms */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <Sparkles size={20} color="var(--primary-burgundy)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Secondary & Neuromuscular Indicators
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Indicate any peripheral, neuromuscular, or dermatologic signs you have observed.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {secondarySymptoms.map((symptom) => {
                  const currentValue = formData[symptom.key];
                  return (
                    <div
                      key={symptom.key}
                      style={{
                        padding: '1.125rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: currentValue === 'Yes' ? 'var(--peach-light)' : '#FFFFFF',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {symptom.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {symptom.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['No', 'Yes'] as const).map((choice) => {
                          const isPicked = currentValue === choice;
                          const isYes = choice === 'Yes';
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => handleSymptomToggle(symptom.key, choice)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${
                                  isPicked
                                    ? isYes
                                      ? 'var(--primary-burgundy)'
                                      : 'var(--accent-low-risk)'
                                    : 'var(--border-color)'
                                }`,
                                backgroundColor: isPicked
                                  ? isYes
                                    ? 'var(--primary-burgundy)'
                                    : 'var(--accent-low-risk)'
                                  : '#FFFFFF',
                                color: isPicked ? '#FFFFFF' : 'var(--text-secondary)',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Review and Submit */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <FileCheck2 size={20} color="var(--primary-burgundy)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Review Your Information
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Please confirm your inputs before evaluating them against the machine-learning screening model.
                </p>
              </div>

              {/* Summary of Demographics */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Reported Age
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formData.Age} years
                  </div>
                </div>
                <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Biological Gender
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formData.Gender}
                  </div>
                </div>
                <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Reported Symptoms
                  </span>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: positiveSymptomCount > 0 ? 'var(--primary-burgundy)' : 'var(--accent-low-risk)',
                    }}
                  >
                    {positiveSymptomCount} of 14 active
                  </div>
                </div>
              </div>

              {/* Symptom Checklist Summary */}
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Symptom Responses (14 Indicators)
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.625rem',
                  }}
                >
                  {SYMPTOM_LIST.map((item) => {
                    const isYes = formData[item.key] === 'Yes';
                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isYes ? 'var(--peach-light)' : '#FAFAFA',
                          border: `1px solid ${isYes ? 'var(--soft-orange)' : 'var(--border-color)'}`,
                          fontSize: '0.8125rem',
                        }}
                      >
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            backgroundColor: isYes ? 'var(--primary-burgundy)' : 'var(--border-color)',
                            color: isYes ? '#FFFFFF' : 'var(--text-secondary)',
                          }}
                        >
                          {formData[item.key]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer reminder */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '0.75rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <ShieldAlert size={18} color="var(--primary-burgundy)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Educational Notice:</strong> By submitting this form, you acknowledge that SugarSense provides
                  an algorithmic risk assessment based on statistical survey patterns. This is not an official medical
                  diagnosis or clinical laboratory blood test.
                </div>
              </div>

              {submitError && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FDF2F2',
                    border: '1px solid var(--primary-burgundy)',
                    color: 'var(--primary-burgundy)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation & Controls footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleRestart}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={15} />
                Reset
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--primary-burgundy)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  Next Step
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--primary-burgundy)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-card)',
                    opacity: isSubmitting ? 0.8 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      Evaluating Model...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Submit for Screening
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
