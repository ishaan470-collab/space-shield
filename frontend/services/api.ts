const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("spaceshield_token");
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("spaceshield_token", token);
  }
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("spaceshield_token");
  }
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    removeToken();
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      window.location.href = "/?session_expired=true";
    }
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Use status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 240 || response.status === 204) {
    return null;
  }

  return response.json();
}

export interface PredictRequest {
  satellite_name?: string;
  altitude: number;
  velocity: number;
  inclination: number;
  orbital_period: number;
  relative_distance: number;
  relative_velocity: number;
}

export interface PredictResponse {
  id?: number;
  satellite_name: string;
  altitude: number;
  velocity: number;
  inclination: number;
  orbital_period: number;
  relative_distance: number;
  relative_velocity: number;
  prediction: string;
  confidence: number;
  explanation: string[];
  feature_importance: Record<string, number>;
  timestamp: string;
}

export interface SatelliteSearchResponse {
  satellite_name: string;
  norad_id: string;
  altitude: number;
  velocity: number;
  inclination: number;
  orbital_period: number;
  eccentricity: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface AnalyticsDashboardResponse {
  total_predictions: number;
  average_confidence: number;
  risk_distribution: RiskDistribution;
  recent_predictions: PredictResponse[];
}

export const apiService = {
  // Auth endpoints
  async register(name: string, email: string, password: string) {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data && data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async getMe() {
    return apiFetch("/api/auth/me");
  },

  // Satellite search
  async searchSatellite(query: string): Promise<SatelliteSearchResponse> {
    return apiFetch(`/api/satellite/search?query=${encodeURIComponent(query)}`);
  },

  // Prediction endpoints
  async predict(data: PredictRequest): Promise<PredictResponse> {
    return apiFetch("/api/predict", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getHistory(): Promise<PredictResponse[]> {
    return apiFetch("/api/history");
  },

  async deleteHistory(predictionId: number): Promise<void> {
    return apiFetch(`/api/history/${predictionId}`, {
      method: "DELETE",
    });
  },

  async getAnalytics(): Promise<AnalyticsDashboardResponse> {
    return apiFetch("/api/analytics");
  },
};
