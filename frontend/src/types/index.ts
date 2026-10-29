export type Gender = 'Male' | 'Female';
export type YesNo = 'Yes' | 'No';
export type PredictionClass = 'Positive' | 'Negative';

export interface QuestionnaireData {
  Age: number;
  Gender: Gender;
  Polyuria: YesNo;
  Polydipsia: YesNo;
  'sudden weight loss': YesNo;
  weakness: YesNo;
  Polyphagia: YesNo;
  'Genital thrush': YesNo;
  'visual blurring': YesNo;
  Itching: YesNo;
  Irritability: YesNo;
  'delayed healing': YesNo;
  'partial paresis': YesNo;
  'muscle stiffness': YesNo;
  Alopecia: YesNo;
  Obesity: YesNo;
}

export interface PredictionResult {
  prediction: PredictionClass;
  risk_assessment: string;
  model_score: number;
  class_probabilities: Record<string, number>;
  disclaimer: string;
  screening_id?: string | null;
}

export interface ScreeningRecord {
  id: string;
  created_at: string;
  questionnaire: QuestionnaireData;
  prediction: PredictionClass;
  risk_assessment: string;
  model_score: number;
  class_probabilities: Record<string, number>;
  model_version?: string;
  disclaimer?: string;
}

export interface ScreeningListResponse {
  items: ScreeningRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface SymptomStat {
  symptom: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  total_screenings: number;
  positive_predictions: number;
  negative_predictions: number;
  positive_percentage: number;
  negative_percentage: number;
  top_reported_symptoms: SymptomStat[];
  disclaimer: string;
}

export interface ModelInfo {
  model_name: string;
  target_classes: string[];
  features: string[];
  metrics: {
    cross_validation?: {
      folds: number;
      mean_accuracy: number;
      mean_recall: number;
      mean_precision: number;
      mean_f1: number;
    };
    test_metrics?: {
      accuracy: number;
      recall_positive: number;
      precision_positive: number;
      f1_positive: number;
      confusion_matrix?: {
        true_negative: number;
        false_positive: number;
        false_negative: number;
        true_positive: number;
      };
    };
  };
  dataset_summary: {
    total_rows: number;
    train_rows: number;
    test_rows: number;
    train_test_split_ratio: string;
  };
  disclaimer: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  model_loaded: boolean;
  model_name?: string | null;
  database_connected: boolean;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'new-screening' 
  | 'history' 
  | 'insights' 
  | 'reports' 
  | 'settings';
