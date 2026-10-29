import type {
  DashboardStats,
  HealthStatus,
  ModelInfo,
  PredictionResult,
  QuestionnaireData,
  ScreeningListResponse,
  ScreeningRecord,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((d: { msg?: string; loc?: string[] }) => d.msg || JSON.stringify(d)).join(', ');
          } else {
            errorMessage = String(errorData.detail);
          }
        }
      } catch {
        // Fallback to text status if JSON parsing fails
      }
      throw new ApiError(errorMessage, res.status);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError(`Network error communicating with SugarSense API at ${API_BASE_URL}. (${message})`, 0);
  }
}

export const api = {
  getHealth: (): Promise<HealthStatus> => {
    return request<HealthStatus>('/health');
  },

  getModelInfo: (): Promise<ModelInfo> => {
    return request<ModelInfo>('/api/v1/model-info');
  },

  predictRisk: (payload: QuestionnaireData): Promise<PredictionResult> => {
    return request<PredictionResult>('/api/v1/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getScreenings: (limit = 20, offset = 0): Promise<ScreeningListResponse> => {
    return request<ScreeningListResponse>(`/api/v1/screenings?limit=${limit}&offset=${offset}`);
  },

  getScreeningById: (id: string): Promise<ScreeningRecord> => {
    return request<ScreeningRecord>(`/api/v1/screenings/${encodeURIComponent(id)}`);
  },

  getStats: (): Promise<DashboardStats> => {
    return request<DashboardStats>('/api/v1/stats');
  },

  getBaseUrl: (): string => API_BASE_URL,
};
